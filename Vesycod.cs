using CmlLib.Core;
using CmlLib.Core.Auth;
using CmlLib.Core.VersionMetadata;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using System.Windows.Shell;
using System.Windows.Threading;
using SubReel.Models;
using SubReel.Native;

namespace SubReel
{
#nullable enable

    // --- ОСНОВНОЙ КЛАСС ОКНА ---
    public partial class MainWindow : Window
    {
        // состояние лаунчера
        // идёт установка файлов
        // защита от двойных кликов
        private JavaSourceType _javaSource = JavaSourceType.Bundled;
        // === контроль обновления UI прогресса ===
        private DateTime _lastUiUpdate = DateTime.MinValue;
        private CancellationTokenSource? _installCts; // токен отмены установки
        public readonly string AppDataPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), ".SubReelGame");
        private Process? _gameProcess; // Сюда сохраним запущенную игру
        private readonly string ConfigPath;
        private readonly string CurrentVersion = "0.1.2";
        private readonly Queue<string> _notificationQueue = new();
        private ProgressController _progress;
        private bool _isToast1Showing = false;
        private bool _isToast2Showing = false;
        private int _filesRemaining = 0;
        // Единая ссылка на твой Gist
        private readonly string MasterUrl = "https://gist.githubusercontent.com/Lemansen/e30a53d49f4d29eb89b89d739dbeb12b/raw/master.json";
        private readonly string _minecraftPath;
        private DispatcherTimer? _updateTimer;
        private static readonly HttpClient _httpClient =
            new HttpClient(new HttpClientHandler
            {
                UseProxy = false,
                Proxy = null,
                DefaultProxyCredentials = null
            });

        private LaunchStage _currentStage = LaunchStage.Idle;
        // состояние лаунчера
        // --- установка Minecraft ---
        private bool _isInstalling = false;
        private CancellationTokenSource? _downloadCts;

        // --- установка Java ---
        private CancellationTokenSource? _javaDownloadCts;
        private bool IsLicensed = true;
        private bool _isLaunching = false;
        private bool _isSyncRunning = false;
        private string _currentTab = "home";
        private readonly SemaphoreSlim _playLock = new SemaphoreSlim(1, 1);
        private MSession? CurrentSession;
        private string _selectedVersion = "1.21.1";
        public ObservableCollection<ChatMessage> Messages { get; set; } = new ObservableCollection<ChatMessage>();
        private static System.Threading.Mutex? _appMutex;
        private bool CanUpdateUi(int ms = 120)
        {
            if ((DateTime.Now - _lastUiUpdate).TotalMilliseconds < ms)
                return false;

            _lastUiUpdate = DateTime.Now;
            return true;
        }
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private const int SW_RESTORE = 9;

        private static async Task<bool> HasInternetAsync()
        {
            try
            {
                using var client = new HttpClient()
                {
                    Timeout = TimeSpan.FromSeconds(3)
                };

                using var resp = await client.GetAsync("https://launchermeta.mojang.com");
                return resp.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
        
        
        private void TryRollbackIfBroken()
        {
            try
            {
                string exe = Process.GetCurrentProcess().MainModule!.FileName!;
                string backup = exe + ".bak";
                string successFlag = exe + ".ok";

                if (!File.Exists(backup))
                    return;

                if (File.Exists(successFlag))
                    return;

                SafeLog("[Update] Обнаружена незавершённая установка. Откат...", Brushes.Orange);

                File.Copy(backup, exe, true);
                File.Delete(backup);

                Process.Start(new ProcessStartInfo
                {
                    FileName = exe,
                    UseShellExecute = true
                });

                Environment.Exit(0);
            }
            catch { }
        }
        private void ConfirmUpdateSuccess()
        {
            try
            {
                string exe = Process.GetCurrentProcess().MainModule!.FileName!;
                string backup = exe + ".bak";

                if (File.Exists(backup))
                {
                    File.Delete(backup);
                    SafeLog("[Update] Обновление успешно подтверждено", Brushes.Lime);
                }
            }
            catch { }
        }

        private string VersionCachePath =>
    Path.Combine(AppDataPath, "version_manifest.json");

        public MainWindow()
        {
            var args = Environment.GetCommandLineArgs();

            if (args.Length > 1 && args[1] == "updated")
            {
                try
                {
                    string exe = Process.GetCurrentProcess().MainModule!.FileName!;
                    File.WriteAllText(exe + ".ok", "ok");
                    ConfirmUpdateSuccess();
                }
                catch { }
            }

            if (args.Length > 1 && args[1] == "apply_update")
            {
                string updateExe = Process.GetCurrentProcess().MainModule!.FileName!;
                UpdaterService.Run(updateExe);
                Application.Current.Shutdown();
                return;
            }

            bool createdNew;

            _appMutex = new System.Threading.Mutex(
                true,
                "SubReelLauncher_SingleInstance",
                out createdNew);

            if (!createdNew)
            {
                // Уже запущен
                FocusExistingInstance();
                ShowNotification("Лаунчер уже запущен");
                Application.Current.Shutdown();
                return;
            }
            // Оставляем ваш WindowChrome
            WindowChrome.SetWindowChrome(this, new WindowChrome
            {
                ResizeBorderThickness = new Thickness(6),
                CaptionHeight = 0,
                CornerRadius = new CornerRadius(0),
                GlassFrameThickness = new Thickness(0),
                UseAeroCaptionButtons = false
            });

            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) SubReelLauncher/1.0");
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
            TryRollbackIfBroken();
            System.Net.WebRequest.DefaultWebProxy = null;

            InitializeComponent();

            SafeLog("[NET] HttpClient создан (proxy disabled)", Brushes.Gray);

            // ✅ очистка старого файла докачки
            try
            {
                var part = Path.Combine(Path.GetTempPath(), "SubReelUpdate.exe.part");
                if (File.Exists(part))
                {
                    if (DateTime.Now - File.GetLastWriteTime(part) > TimeSpan.FromDays(1))
                        File.Delete(part);
                }
            }
            catch { }
            GlobalExceptionHandler.Initialize(
        msg => SafeLog(msg, Brushes.Red),
        msg => ShowNotification(msg)
    );
            // 🔥 Глобальный перехват ошибок UI
            Application.Current.DispatcherUnhandledException += (s, e) =>
            {
                SafeLog("[CRASH UI] " + e.Exception, Brushes.Red);

                ShowCrashDialog(new CrashReport
                {
                    Title = "Критическая ошибка интерфейса",
                    Solution = e.Exception.Message
                });

                e.Handled = true;
            };

            // 🔥 Ошибки фоновых потоков
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                SafeLog("[CRASH DOMAIN] " + e.ExceptionObject, Brushes.Red);
            };

            // 🔥 Ошибки async задач
            TaskScheduler.UnobservedTaskException += (s, e) =>
            {
                SafeLog("[CRASH TASK] " + e.Exception, Brushes.Red);
                e.SetObserved();
            };
            SourceInitialized += (s, e) =>
            {
                var handle = new WindowInteropHelper(this).Handle;
                HwndSource.FromHwnd(handle)?.AddHook(WindowProc);
            };
            if (Resources["OnlinePulse"] is Storyboard sb)
                sb.Begin();
            ConfigPath = Path.Combine(AppDataPath, "config.json");
            if (AppVersionText != null) AppVersionText.Text = $"v{CurrentVersion}";
            this.StateChanged += (s, e) => UpdateWindowLayout();

            // ИСПРАВЛЕНО: Правильное обращение к системным событиям
            // В конструкторе MainWindow()
            Microsoft.Win32.SystemEvents.DisplaySettingsChanged += (s, e) =>
            {
                Dispatcher.BeginInvoke(new Action(() => {
                    // Запоминаем текущее состояние
                    var currentState = this.WindowState;

                    if (currentState == WindowState.Maximized)
                    {
                        // Сбрасываем в Normal и сразу возвращаем в Maximized.
                        // Это заставляет WPF пересчитать физические пиксели под новый DPI.
                        this.WindowState = WindowState.Normal;
                        this.WindowState = WindowState.Maximized;
                    }

                    // Всегда вызываем обновление геометрии
                    UpdateWindowLayout();

                }), DispatcherPriority.Render);
            };


            SystemParameters.StaticPropertyChanged += SystemParameters_StaticPropertyChanged;

            // Сначала настраиваем размеры
            UpdateWindowLayout();

            // Логику загрузки данных запускаем ТОЛЬКО ОДИН РАЗ при старте
            this.Loaded += OnWindowLoaded;
        }


        // ЭТОТ МЕТОД ТЕПЕРЬ ОТВЕЧАЕТ ТОЛЬКО ЗА ГЕОМЕТРИЮ
        
        private async Task DownloadFileWithResume(
    string url,
    string finalFile,
    CancellationToken token)
        {
            string partFile = finalFile + ".part";

            long existingBytes = 0;
            if (File.Exists(partFile))
                existingBytes = new FileInfo(partFile).Length;

            var request = new HttpRequestMessage(HttpMethod.Get, url);

            if (existingBytes > 0)
                request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(existingBytes, null);

            using var response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                token);

            response.EnsureSuccessStatusCode();

            long totalBytes = existingBytes + (response.Content.Headers.ContentLength ?? 0);

            using var stream = await response.Content.ReadAsStreamAsync(token);
            using var file = new FileStream(
                partFile,
                FileMode.Append,
                FileAccess.Write,
                FileShare.None);

            byte[] buffer = new byte[81920];
            int read;

            while ((read = await stream.ReadAsync(buffer, 0, buffer.Length, token)) > 0)
            {
                await file.WriteAsync(buffer, 0, read, token);
                existingBytes += read;
            }
            file.Close();

            File.Move(partFile, finalFile, true);

            if (!File.Exists(finalFile))
                throw new Exception("Файл обновления не найден");

            if (new FileInfo(finalFile).Length < 1_000_000)
                throw new Exception("Файл обновления поврежден");
        }
        private async Task DownloadAndApplyUpdate(string url)
        {
            string tempFile = Path.Combine(Path.GetTempPath(), "SubReel_update.exe");

            await RetryHelper.RetryAsync<object?>(
                async () =>
                {
                    await DownloadFileWithResume(url, tempFile, CancellationToken.None);
                    return null;
                },
                3,
                2000,
                msg => SafeLog(msg, Brushes.Orange)
            );

            SafeLog("[Update] Загрузка завершена", Brushes.Lime);

            ApplyUpdate(tempFile);
        }

        // Это событие срабатывает само, когда ты нажимаешь на "крестик" или закрываешь окно
        
        private async Task HandleReleasePopup(MasterConfig master)
        {
            if (master?.Status?.ReleasePopup == null)
                return;

            var popup = master.Status.ReleasePopup;

            if (!popup.Enabled)
                return;

            string tagPath = Path.Combine(AppDataPath, "infovnachale.tag");
            bool alreadySeen = File.Exists(tagPath);

            if (popup.Force || (popup.ShowOnce && !alreadySeen))
            {
                // Заполняем текст
                WelcomeTitle.Text = popup.Title;
                WelcomeMessage.Text = popup.Message;
                WelcomeSubMessage.Text = popup.SubMessage;

                // Показываем окно
                WelcomeOverlay.Visibility = Visibility.Visible;
                WelcomeOverlay.Opacity = 1;

                if (popup.ShowOnce && !alreadySeen)
                {
                    try
                    {
                        if (!Directory.Exists(AppDataPath))
                            Directory.CreateDirectory(AppDataPath);

                        File.Create(tagPath).Close();
                    }
                    catch { }
                }
            }
        }

        private async Task<MasterConfig?> SyncWithMasterJson()
        {
            try
            {
                // 1. Проверка физического подключения
                if (!System.Net.NetworkInformation.NetworkInterface.GetIsNetworkAvailable())
                {
                    SafeLog("[System] Сетевой кабель не подключен или нет Wi-Fi.", Brushes.Orange);
                    SetOfflineStatus();
                    return null;
                }

                // 2. Запрос с анти-кэшем и заголовком (чтобы GitHub не отфутболил)
                // Добавь это в конструктор MainWindow, если еще не сделал:
                // _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("SubReelLauncher/1.0");

                string urlWithTics = MasterUrl + "?t=" + DateTime.Now.Ticks;
                string json = await _httpClient.GetStringAsync(urlWithTics);

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var data = JsonSerializer.Deserialize<MasterConfig>(json, options);

                if (data != null)
                {
                    Dispatcher.Invoke(() =>
                    {
                        // Обновляем индикатор сети
                        if (OnlineCircle != null)
                            OnlineCircle.Fill = (SolidColorBrush)new BrushConverter().ConvertFrom("#20F289");

                        // Обновляем счетчик онлайна
                        if (data.Status != null && OnlineCount != null)
                            OnlineCount.Text = $"{data.Status.OnlineCount} ONLINE";

                        // Подгружаем новости
                        if (data.News != null && NewsItemsControl != null)
                            NewsItemsControl.ItemsSource = data.News;

                        // Проверяем версию установщика
                        if (data.Installer != null && data.Installer.Version != CurrentVersion)
                        {
                            if (UpdateBadge != null)
                            {
                                UpdateBadge.Visibility = Visibility.Visible;
                                UpdateBadge.Tag = data.Installer.DownloadUrl; // Сохраняем ссылку для клика
                            }
                        }
                    });

                    return data;
                }
            }
            catch (HttpRequestException httpEx)
            {
                SafeLog($"[Network] Ошибка HTTP: {httpEx.StatusCode}. Проверьте доступ к GitHub.", Brushes.Red);
                SetOfflineStatus();
            }
            catch (Exception ex)
            {
                SafeLog($"[System] Ошибка синхронизации: {ex.Message}", Brushes.Gray);
                SetOfflineStatus();
            }
            return null;
        }

        // ... остальной код (CloseBtn_Click и т.д.)


        private DispatcherTimer? _newsTimer;

        // Это главный контейнер для всего JSON

        

        // Переопределяем поведение при изменении состояния для коррекции UI
        // --- Исправление Maximize для WindowStyle.None ---

        [DllImport("user32.dll")]
        private static extern IntPtr MonitorFromWindow(IntPtr handle, int flags);

        [DllImport("user32.dll")]
        private static extern bool GetMonitorInfo(IntPtr hMonitor, MONITORINFO lpmi);

        
        
        public void UI(Action action)
        {
            if (Dispatcher.CheckAccess())
                action();
            else
                Dispatcher.Invoke(action);
        }
        
        
        private async Task CheckForCrashAndShowAsync()
        {
            var report = await AnalyzeCrashAsync();

            if (report != null)
            {
                Dispatcher.Invoke(() => ShowCrashDialog(report));
            }
        }
        private string AvatarCachePath =>
    Path.Combine(AppDataPath, "avatar.png");
        private async Task LoadUserAvatarAsync(string uuid)
        {
            try
            {
                byte[] bytes;

                if (File.Exists(AvatarCachePath))
                {
                    bytes = await File.ReadAllBytesAsync(AvatarCachePath);
                }
                else
                {
                    string url = $"https://crafatar.com/avatars/{uuid}?size=128&overlay";
                    bytes = await _httpClient.GetByteArrayAsync(url);
                    await File.WriteAllBytesAsync(AvatarCachePath, bytes);
                }

                using var ms = new MemoryStream(bytes);
                var image = new BitmapImage();

                image.BeginInit();
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.StreamSource = ms;
                image.EndInit();
                image.Freeze();

                UserAvatarImg.ImageSource = image;
            }
            catch { }
        }

        
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace SubReel
{
    using System.ComponentModel;
    using System.Linq;

    public class BuildModel : INotifyPropertyChanged
    {
        public string Name { get; set; }
        public string Version { get; set; }
        public string Loader { get; set; }
        public string Icon { get; set; } = "🧩";

        private bool _isFavorite;
        public bool IsFavorite
        {
            get => _isFavorite;
            set { _isFavorite = value; OnPropertyChanged(nameof(IsFavorite)); }
        }
        private bool _isSelected;
        public bool IsSelected
        {
            get => _isSelected;
            set { _isSelected = value; OnPropertyChanged(nameof(IsSelected)); }
        }


        public BuildModel(string name, string version, string loader, bool isFavorite = false)
        {
            Name = name;
            Version = version;
            Loader = loader;
            IsFavorite = isFavorite;
        }

        public event PropertyChangedEventHandler PropertyChanged;
        protected void OnPropertyChanged(string name) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }

    

}

using System;
using System.Globalization;
using System.Windows.Data;

namespace SubReel
{
    public class InverseBoolConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool b)
                return !b;

            return false;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool b)
                return !b;

            return false;
        }
    }
}
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
#nullable enable

namespace SubReel
{
    
        public static string? GetBundledJavaPath(int javaVersion)
        {
            string path = System.IO.Path.Combine(
                RuntimeRoot,
                $"java{javaVersion}",
                "bin",
                "javaw.exe"
            );

            return File.Exists(path) ? path : null;
        }
        public static string? GetExistingRuntime(int javaVersion)
        {
            string dir = Path.Combine(RuntimeRoot, $"java{javaVersion}");
            string exe = Path.Combine(dir, "bin", "javaw.exe");

            if (File.Exists(exe))
                return exe;

            return null;
        }
        public static string? FindSystemJava()
        {
            try
            {
                var javaHome = Environment.GetEnvironmentVariable("JAVA_HOME");
                if (!string.IsNullOrEmpty(javaHome))
                {
                    var javaExe = System.IO.Path.Combine(javaHome, "bin", "java.exe");
                    if (File.Exists(javaExe))
                        return javaExe;
                }

                var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                var javaDir = System.IO.Path.Combine(programFiles, "Java");

                if (Directory.Exists(javaDir))
                {
                    var javaExe = Directory.GetFiles(javaDir, "java.exe", SearchOption.AllDirectories)
                                           .FirstOrDefault();
                    if (javaExe != null)
                        return javaExe;
                }
            }
            catch { }

            return null;
        }
        public static async Task<string> EnsureBundledJavaAsync(
     int javaVersion,
     IProgress<double> progress,
     CancellationToken token,
     Action<string>? log = null)
        {
            await _installLock.WaitAsync(token);

            try
            {
                Directory.CreateDirectory(RuntimeRoot);

                string targetDir = Path.Combine(RuntimeRoot, $"java{javaVersion}");
                string javaExe = Path.Combine(targetDir, "bin", "javaw.exe");
                string marker = Path.Combine(targetDir, ".installed");

                if (File.Exists(javaExe) && File.Exists(marker))
                {
                    progress?.Report(100);
                    log?.Invoke("[JAVA] Используется кэшированная версия");
                    return javaExe;
                }

                if (Directory.Exists(targetDir))
                {
                    try { Directory.Delete(targetDir, true); }
                    catch { }
                }

                Directory.CreateDirectory(targetDir);

                string arch = Environment.Is64BitOperatingSystem ? "x64" : "x86";
                string url =
                    $"https://api.adoptium.net/v3/binary/latest/{javaVersion}/ga/windows/{arch}/jre/hotspot/normal/eclipse";

                string zipPath = Path.Combine(targetDir, "runtime.zip");

                using HttpClient client = new HttpClient
                {
                    Timeout = TimeSpan.FromMinutes(5)
                };
                using var response = await RetryHelper.RetryAsync(
                    () => client.GetAsync(
                        url,
                        HttpCompletionOption.ResponseHeadersRead,
                        token),
                    3,
                    1500,
                    log);

                response.EnsureSuccessStatusCode();

                var total = response.Content.Headers.ContentLength ?? -1L;
                var canReport = total > 0;

                await ResumableDownloader.DownloadFileAsync(
    client,
    url,
    zipPath,
    progress,
    token
);

                await Task.Delay(150, token);
                if (!File.Exists(zipPath) || new FileInfo(zipPath).Length < 1_000_000)
                    throw new Exception("Архив Java поврежден или скачан не полностью");
                try
                {
                    using var zipStream = new FileStream(
                        zipPath,
                        FileMode.Open,
                        FileAccess.Read,
                        FileShare.Read);

                    ZipFile.ExtractToDirectory(zipStream, targetDir, true);
                }
                catch (InvalidDataException)
                {
                    try { File.Delete(zipPath); } catch { }
                    throw new Exception("Архив Java поврежден, будет выполнена повторная загрузка");
                }

                File.Delete(zipPath);

                var innerDir = Directory.GetDirectories(targetDir)
                    .FirstOrDefault(d => File.Exists(Path.Combine(d, "bin", "javaw.exe")));

                if (innerDir != null && !File.Exists(javaExe))
                {
                    foreach (var item in Directory.GetFileSystemEntries(innerDir))
                    {
                        string dest = Path.Combine(targetDir, Path.GetFileName(item));

                        if (Directory.Exists(item))
                            Directory.Move(item, dest);
                        else
                            File.Move(item, dest);
                    }

                    Directory.Delete(innerDir, true);
                }

                await File.WriteAllTextAsync(marker, "ok", token);
                if (!File.Exists(javaExe))
                    throw new Exception("Java установлена, но javaw.exe не найден");
                progress?.Report(100);
                return javaExe;
            }
            finally
            {
                _installLock.Release();
            }
        }
    }
}
    
    using CmlLib.Core;
using CmlLib.Core.Auth;
using CmlLib.Core.Installers;
using CmlLib.Core.ProcessBuilder;
using Microsoft.VisualBasic.Logging;
using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.StartPanel;
#nullable enable
namespace SubReel
{
    

}
    using CmlLib.Core.Auth;

namespace SubReel
{
#nullable enable
    public class LaunchOptions
    {
        public bool OfflineMode { get; set; }

        public string Nickname { get; set; } = "Player";

        // RAM в MB
        public int RamMb { get; set; } = 4096;

        public bool ShowConsole { get; set; }
        public bool IsLicensed { get; set; }

        public string Version { get; set; } = "1.21.1";

        public string? JavaPath { get; set; }
        public string? ManualJavaPath { get; set; }

        public MSession? Session { get; set; }

        // 🔥 ДОБАВИТЬ ДЛЯ LauncherService
        public string GamePath { get; set; } = "";

        public int MinRamMb => 1024;
        public int MaxRamMb => RamMb;

        public string Username => Nickname;
    }
}

using CmlLib.Core;
using CmlLib.Core.Auth;
using CmlLib.Core.Auth.Microsoft;
using CmlLib.Core.Installers;
using CmlLib.Core.ProcessBuilder;
using CmlLib.Core.VersionMetadata;
using CmlLib.Core.Version;
using System;
using System.Collections.Generic; // Обязательно для List<NewsItem>
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using System.Windows.Threading;
using IO = System.IO;
using IOPath = System.IO.Path;
using SubReel.Models;

#nullable enable


namespace SubReel
{
    public partial class MainWindow : Window
    {

        private int GetRequiredJavaMajor(string mcVersion)
        {
            if (Version.TryParse(mcVersion, out var v))
            {
                if (v >= new Version(1, 20, 5)) return 21;
                if (v >= new Version(1, 17)) return 17;
            }

            return 8;
        }
        // --- НАСТРОЙКИ И ОБНОВЛЕНИЯ ---
        public void SaveSettings()
        {
            if (!IsLoaded) return;

            try
            {
                var s = SettingsManager.Current;

                s.Nickname = string.IsNullOrWhiteSpace(NicknameBox?.Text)
                    ? "Player"
                    : NicknameBox.Text.Trim();

                s.Ram = RamSlider?.Value ?? 4096;
                s.IsLicensed = IsLicensed;
                s.SelectedVersion = _selectedVersion ?? "1.21.1";
                s.IsConsoleShow = ConsoleCheck?.IsChecked == true;
                s.ManualJavaPath = _manualJavaPath;
                s.JavaSource = _javaSource;

                SettingsManager.Save(ConfigPath);

                Debug.WriteLine("Настройки успешно сохранены: " + ConfigPath);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Ошибка сохранения настроек: " + ex.Message);
            }
        }
        private string? FindSystemJava()
        {
            try
            {
                var javaHome = Environment.GetEnvironmentVariable("JAVA_HOME");

                if (!string.IsNullOrWhiteSpace(javaHome))
                {
                    var path = System.IO.Path.Combine(javaHome, "bin", "javaw.exe");
                    if (File.Exists(path))
                        return path;
                }

                var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                var javaDir = System.IO.Path.Combine(programFiles, "Java");

                if (Directory.Exists(javaDir))
                {
                    foreach (var dir in Directory.GetDirectories(javaDir))
                    {
                        var path = System.IO.Path.Combine(dir, "bin", "javaw.exe");
                        if (File.Exists(path))
                            return path;
                    }
                }
            }
            catch { }

            return null;
        }
        private LaunchOptions BuildLaunchOptions()
        {
            return new LaunchOptions
            {
                Nickname = string.IsNullOrWhiteSpace(NicknameBox?.Text)
                    ? "Player"
                    : NicknameBox.Text.Trim(),

                RamMb = (int)(RamSlider?.Value ?? 4096),
                Version = _selectedVersion ?? "1.21.1",
                ShowConsole = ConsoleCheck?.IsChecked == true,
                IsLicensed = IsLicensed,
                Session = CurrentSession,

                GamePath = AppDataPath,   // 🔥 ОБЯЗАТЕЛЬНО

                JavaPath = null
            };
        }
        private void ApplySettingsToUI()
        {
            var s = SettingsManager.Current;

            if (NicknameBox != null)
                NicknameBox.Text = s.Nickname;

            if (DisplayNick != null)
                DisplayNick.Text = s.Nickname;

            if (ConsoleCheck != null)
                ConsoleCheck.IsChecked = s.IsConsoleShow;

            if (RamSlider != null)
                RamSlider.Value = s.Ram;

            if (RamInput != null)
                RamInput.Text = ((int)s.Ram).ToString();

            if (GbText != null)
                GbText.Text = $"{(s.Ram / 1024.0):F1} GB";
        }

        private void LoadSettings()
        {
            if (!File.Exists(ConfigPath))
                return;
            try
            {
                var json = File.ReadAllText(ConfigPath);

                using (JsonDocument doc = JsonDocument.Parse(json))
                {
                    var root = doc.RootElement;

                    // --- НИК ---
                    string nick = root.TryGetProperty("Nickname", out var nickProp)
                        ? (nickProp.GetString() ?? "Player")
                        : "Player";

                    if (string.IsNullOrWhiteSpace(nick)) nick = "Player";

                    if (NicknameBox != null) NicknameBox.Text = nick;
                    if (DisplayNick != null) DisplayNick.Text = nick;

                    // --- АВАТАР ---
                    if (UserAvatarImg != null)
                    {
                        try
                        {
                            var bitmap = new System.Windows.Media.Imaging.BitmapImage();
                            bitmap.BeginInit();
                            bitmap.UriSource = new Uri($"https://minotar.net/helm/{nick}/45.png", UriKind.Absolute);
                            bitmap.CacheOption = System.Windows.Media.Imaging.BitmapCacheOption.OnLoad;
                            bitmap.CreateOptions = System.Windows.Media.Imaging.BitmapCreateOptions.IgnoreColorProfile;
                            bitmap.EndInit();
                            bitmap.Freeze();

                            UserAvatarImg.ImageSource = bitmap;
                        }
                        catch { }
                    }

                    // --- КОНСОЛЬ ---
                    if (root.TryGetProperty("IsConsoleShow", out var consoleProp))
                    {
                        if (ConsoleCheck != null)
                            ConsoleCheck.IsChecked = consoleProp.GetBoolean();
                    }
                    if (root.TryGetProperty("ManualJavaPath", out var javaProp))
                    {
                        _manualJavaPath = javaProp.ValueKind == JsonValueKind.String
                            ? javaProp.GetString()
                            : null;
                    }

                    // 👇 ОБНОВЛЕНИЕ ИНДИКАТОРА (после установки CheckBox)
                    if (ConsoleIndicator != null && ConsoleCheck != null)
                    {
                        ConsoleIndicator.Visibility =
                            ConsoleCheck.IsChecked == true
                            ? Visibility.Visible
                            : Visibility.Collapsed;
                    }

                    // --- RAM ---
                    if (root.TryGetProperty("Ram", out var ramProp) && RamSlider != null)
                    {
                        if (ramProp.ValueKind == JsonValueKind.Number)
                        {
                            double ramValue = ramProp.GetDouble();
                            ramValue = Math.Max(RamSlider.Minimum, Math.Min(RamSlider.Maximum, ramValue));
                            RamSlider.Value = ramValue;

                            Dispatcher.BeginInvoke(new Action(() =>
                            {
                                if (RamInput != null)
                                    RamInput.Text = ((int)ramValue).ToString();

                                if (GbText != null)
                                    GbText.Text = $"{(ramValue / 1024.0):F1} GB";
                            }), System.Windows.Threading.DispatcherPriority.Background);
                        }
                    }

                    // --- ЛИЦЕНЗИЯ ---
                    if (root.TryGetProperty("IsLicensed", out var licensedProp))
                    {
                        IsLicensed = licensedProp.GetBoolean();

                        if (AccountTypeStatus != null && AccountTypeBadge != null)
                        {
                            if (IsLicensed)
                            {
                                AccountTypeStatus.Text = "PREMIUM";
                                AccountTypeStatus.Foreground = Brushes.Black;
                                AccountTypeBadge.Background = new SolidColorBrush(Color.FromRgb(255, 170, 0));
                            }
                            else
                            {
                                AccountTypeStatus.Text = "OFFLINE";
                                AccountTypeStatus.Foreground = new SolidColorBrush(Color.FromRgb(255, 165, 0));
                                AccountTypeBadge.Background = new SolidColorBrush(Color.FromArgb(40, 255, 255, 255));
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                SafeLog($"LoadSettings error: {ex.Message}", Brushes.Red);
            }
        }

        private void UpdateRamUI()
        {
            // Проверяем, что слайдер существует
            if (RamSlider == null) return;

            double val = RamSlider.Value;

            // Обновляем текстовые поля напрямую
            if (RamInput != null)
                RamInput.Text = ((int)val).ToString();

            if (GbText != null)
                GbText.Text = $"{(val / 1024.0):F1} GB";
        }


        private void AppendLog(string message, SolidColorBrush color)
        {
            Dispatcher.Invoke(() =>
            {
                if (LogText == null) return;

                // Создаем новый "пробег" текста с нужным цветом
                Run run = new Run(message + Environment.NewLine) { Foreground = color };

                // Добавляем его в Inlines нашего TextBlock
                // Твой LogText в XAML должен поддерживать Inlines (это стандарт для TextBlock)
                LogText.Inlines.Add(run);

                // Авто-скролл вниз, который у тебя уже был
                LogScroll?.ScrollToEnd();
            });
        }


        // --- [А] ПРОВЕРКА ОБНОВЛЕНИЙ ---
        private async Task CheckForUpdates()
        {
            try
            {
                // 1. Получаем JSON с защитой от кэширования (добавляем Ticks)
                string jsonString = await _httpClient.GetStringAsync(MasterUrl + "?t=" + DateTime.Now.Ticks);

                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                // 2. Десериализуем в MasterConfig
                var master = System.Text.Json.JsonSerializer.Deserialize<MasterConfig>(jsonString, options);

                if (master != null)
                {
                    Dispatcher.Invoke(() =>
                    {
                        // --- [ИСПРАВЛЕНО] 1. ОБНОВЛЯЕМ ОНЛАЙН И ЦВЕТ СТАТУСА ---
                        if (master.Status != null && OnlineCount != null)
                        {
                            OnlineCount.Text = $"ОНЛАЙН: {master.Status.OnlineCount}";

                            // Теперь проверяем не только цифру, но и статус сервера из JSON
                            // В твоем JSON это поле "server_status": "online"
                            bool isOnline = master.Status.OnlineCount > 0;

                            // Если в JSON будет добавлено поле ServerStatus (как в моем совете выше), 
                            // можно проверять его. Пока оставляем проверку по количеству игроков:
                            if (OnlineCircle != null)
                            {
                                OnlineCircle.Fill = isOnline
                                    ? (SolidColorBrush)new BrushConverter().ConvertFrom("#20F289")
                                    : Brushes.Gray;
                            }
                        }

                        // --- [БЕЗОПАСНО] 2. ПРОВЕРЯЕМ ВЕРСИЮ ---
                        if (master.Installer != null)
                        {
                            // 1. Сравниваем версии (CurrentVersion должна быть прописана в начале класса, например "1.0.0")
                            bool hasNewVersion = !string.IsNullOrEmpty(master.Installer.Version) &&
                                                 master.Installer.Version != CurrentVersion;

                            if (hasNewVersion)
                            {
                                // 2. Проверяем, что ссылка на скачивание вообще есть в JSON
                                if (!string.IsNullOrEmpty(master.Installer.DownloadUrl))
                                {
                                    UpdateBadge.Visibility = Visibility.Visible;
                                    LauncherVersionText.Text = $"ОБНОВИТЬ ДО {master.Installer.Version}";

                                    // Сохраняем ссылку в Tag, чтобы метод UpdateBadge_Click её подцепил
                                    UpdateBadge.Tag = master.Installer.DownloadUrl;

                                    // Запуск анимации (PulseUpdateAnim должна быть в MainWindow.xaml в <Window.Resources>)
                                    if (this.Resources.Contains("PulseUpdateAnim"))
                                    {
                                        var sb = (Storyboard)this.Resources["PulseUpdateAnim"];
                                        sb?.Begin(UpdateBadge); // Указываем конкретный объект для анимации
                                    }
                                }
                            }
                            else
                            {
                                // Если версия актуальная — прячем кнопку
                                UpdateBadge.Visibility = Visibility.Collapsed;
                            }
                        }

                    });
                }
            }
            catch (Exception ex)
            {
                Dispatcher.Invoke(() => {
                    if (OnlineCount != null) OnlineCount.Text = "OFFLINE";
                    if (OnlineCircle != null) OnlineCircle.Fill = Brushes.Red; // Красный, если нет связи
                });
                SafeLog($"[System] Ошибка синхронизации: {ex.Message}", Brushes.Gray);
            }
        }

        private bool _isUpdating = false;
        private CancellationTokenSource _updateCts;
        
        private void CancelUpdate_Click(object sender, RoutedEventArgs e)
        {
            _updateCts?.Cancel();
        }

        private async void StartManualUpdate(string downloadUrl)
        {

            if (_isUpdating)
                return;

            _isUpdating = true;
            _updateCts = new CancellationTokenSource();
            var token = _updateCts.Token;

            if (LauncherVersionText != null)
                LauncherVersionText.IsHitTestVisible = false;
           
            string tempFile = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                "SubReelUpdate.exe");
            string partFile = tempFile + ".part";
            long existingBytes = 0;

            if (File.Exists(partFile))
            {
                existingBytes = new FileInfo(partFile).Length;
                SafeLog($"[Update] Найден незавершенный файл ({existingBytes} байт)", Brushes.Orange);
            }
            try
            {
                SafeLog("[Update] Начинаю загрузку новой версии...", Brushes.Cyan);

                var request = new HttpRequestMessage(HttpMethod.Get, downloadUrl);

                if (existingBytes > 0)
                    request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(existingBytes, null);

                using (var response = await RetryHelper.RetryAsync(
                    () => _httpClient.SendAsync(
                        request,
                        HttpCompletionOption.ResponseHeadersRead,
                        token),
                    3,
                    2000,
                    msg =>
                    {
                        SafeLog(msg, Brushes.Orange);
                        AppLogger.Log(msg);
                        if (msg.Contains("Попытка"))
                        {
                            Dispatcher.Invoke(() =>
                            {
                                StatusLabel.Text = "ОБНОВЛЕНИЕ: проблемы с сетью...";
                            });
                        }
                    }))
                {
                    response.EnsureSuccessStatusCode();

                    var totalBytes = response.Content.Headers.ContentLength;
                    bool canReportProgress = totalBytes.HasValue && totalBytes.Value > 0;

                    if (!canReportProgress)
                    {
                        Dispatcher.Invoke(() =>
                        {
                            StatusLabel.Text = "ОБНОВЛЕНИЕ: загрузка...";
                        });
                    }
                    Directory.CreateDirectory(System.IO.Path.GetDirectoryName(tempFile)!);
                    using (var contentStream = await response.Content.ReadAsStreamAsync(token))
                    using (var fileStream = new FileStream(
    partFile,
    existingBytes > 0 ? FileMode.Append : 
    FileMode.Create,
                        FileAccess.Write,
                        FileShare.None,
                        8192,
                        true))
                    {
                        var buffer = new byte[8192];
                        long totalRead = 0;
                        int bytesRead;
                        long lastUiUpdate = 0;

                        while ((bytesRead = await contentStream.ReadAsync(buffer.AsMemory(0, buffer.Length), token)) > 0)
                        {
                            token.ThrowIfCancellationRequested();

                            await fileStream.WriteAsync(buffer, 0, bytesRead, token);
                            totalRead += bytesRead;

                            if (canReportProgress && totalRead - lastUiUpdate > 50000)
                            {
                                lastUiUpdate = totalRead;

                                long fullRead = existingBytes + totalRead;
                                int percent = (int)(fullRead * 100 / (existingBytes + totalBytes.Value));
                            }
                        }
                    }
                }
                // 🔥 завершаем докачку → делаем финальный exe
                if (!File.Exists(partFile))
                    throw new Exception("Файл обновления не найден (.part)");

                if (File.Exists(tempFile))
                    File.Delete(tempFile);

                File.Move(partFile, tempFile);

                SafeLog("[Update] Файл обновления готов", Brushes.Lime);

                // 🔥 проверка файла перед установкой
                if (new FileInfo(tempFile).Length < 1_000_000)
                    throw new Exception("Файл обновления поврежден");

                SafeLog("[Update] Загрузка завершена. Установка...", Brushes.Lime);

                await Task.Delay(400, token);

                ApplyUpdate(tempFile);
            }

            finally
            {
                _updateCts?.Dispose();
                _updateCts = null;
                _isUpdating = false;

                if (LauncherVersionText != null)
                    LauncherVersionText.IsHitTestVisible = true;
            }
        }


        // --- [В] УСТАНОВКА (САМОЗАМЕНА) ---
        private void ApplyUpdate(string tempFilePath)
        {
            try
            {
                if (!File.Exists(tempFilePath))
                {
                    SafeLog("[Update] Файл обновления не найден!", Brushes.Red);
                    ShowNotification("Ошибка обновления: файл не найден");
                    return;
                }

                if (new FileInfo(tempFilePath).Length < 1_000_000)
                {
                    SafeLog("[Update] Файл обновления поврежден!", Brushes.Red);
                    ShowNotification("Ошибка обновления: файл поврежден");
                    return;
                }

                try
                {
                    using var fs = File.Open(tempFilePath, FileMode.Open, FileAccess.Read, FileShare.None);
                }
                catch
                {
                    SafeLog("[Update] Файл обновления заблокирован!", Brushes.Red);
                    ShowNotification("Файл обновления занят системой");
                    return;
                }

                string currentExe = Process.GetCurrentProcess().MainModule!.FileName!;
                string batchPath = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "SR_Updater.bat");

                string backupExe = currentExe + ".bak";

                string batchContent = $@"
@echo off
timeout /t 2 /nobreak > nul

:retry
del /f /q ""{currentExe}"" > nul 2>&1
if exist ""{currentExe}"" (
    timeout /t 1 /nobreak > nul
    goto retry
)

copy /y ""{currentExe}"" ""{backupExe}"" > nul 2>&1
copy /y ""{tempFilePath}"" ""{currentExe}"" > nul 2>&1

if not exist ""{currentExe}"" (
    copy /y ""{backupExe}"" ""{currentExe}""
    exit
)

start """" ""{currentExe}"" updated
del ""%~f0""
";

                File.WriteAllText(batchPath, batchContent);

                Thread.Sleep(300);

                SafeLog("[Update] Применение обновления...", Brushes.Lime);

                // запускаем встроенный updater
                UpdaterService.Run(tempFilePath);

                // закрываем текущую версию
                Application.Current.Shutdown();

                Task.Delay(600).ContinueWith(_ =>
                {
                    Application.Current.Dispatcher.Invoke(() =>
                        Application.Current.Shutdown());
                });
            }
            catch (Exception ex)
            {
                SafeLog($"[Update] Ошибка установки: {ex}", Brushes.Red);
                ShowNotification("Ошибка установки обновления");
            }
        }
        private async Task TryAutoUpdateSilent()
        {
            try
            {
                var master = await SyncWithMasterJson();
                if (master?.Installer == null)
                    return;

                if (master.Installer.Version == CurrentVersion)
                    return;

                SafeLog("[Update] Найдена новая версия. Тихое обновление...", Brushes.Orange);

                await DownloadAndApplyUpdate(master.Installer.DownloadUrl);
            }
            catch (Exception ex)
            {
                SafeLog("[Update] Silent update failed: " + ex.Message, Brushes.Gray);
            }
        }
        private void SafeLog(string message, SolidColorBrush color = null)
        {
            // Если мы вызвали метод не из главного потока (например, из процесса игры),
            // Dispatcher.BeginInvoke перенаправит задачу в UI-поток.
            Dispatcher.BeginInvoke(new Action(() =>
            {
                try
                {
                    if (LogText == null) return;

                    // 1. Используем стандартный цвет (AccentBlue), если другой не указан
                    var logColor = color;

                    if (logColor == null)
                    {
                        try
                        {
                            logColor = (SolidColorBrush)FindResource("AccentBlue");
                        }
                        catch
                        {
                            logColor = Brushes.LightBlue;
                        }
                    }
                    if (message.Contains("[CRASH]"))

                    WriteLauncherLogToFile(message);
                    var runMsg = new Run(message + Environment.NewLine) { Foreground = logColor };
                    LogText.Inlines.Add(runMsg);

                    // 5. Авто-скролл вниз
                    LogScroll?.ScrollToEnd();

                    // 6. Защита от переполнения: если логов > 300, удаляем старые
                    if (LogText.Inlines.Count > 600)
                    {
                        // Удаляем по 2 элемента (время + сообщение)
                        LogText.Inlines.Remove(LogText.Inlines.FirstInline);
                        LogText.Inlines.Remove(LogText.Inlines.FirstInline);
                    }
                }
                catch { /* Ошибки логов не должны вешать лаунчер */ }
            }));
        }



        // --- АВТОРИЗАЦИЯ ---
        private async Task MicrosoftLogin()
        {
            try
            {
                var loginHandler = new JELoginHandlerBuilder().Build();

                // Показываем в статусе, что ждем действий от юзера
                AppendLog("[Auth] Ожидание авторизации в браузере...", Brushes.Cyan);

                var session = await loginHandler.AuthenticateInteractively();

                Dispatcher.Invoke(() =>
                {
                    if (session != null)
                    {
                        DisplayNick.Text = session.Username;

                        // Проверка на корректность URL аватара
                        try
                        {
                            UserAvatarImg.ImageSource = new System.Windows.Media.Imaging.BitmapImage(new Uri($"https://minotar.net/helm/{session.Username}/45.png"));
                        }
                        catch { /* Если сервис аватаров лежит, не падаем */ }

                        if (AccountTypeStatus != null)
                        {
                            AccountTypeStatus.Text = "PREMIUM";
                            AccountTypeStatus.Foreground = Brushes.Black;
                        }
                        if (AccountTypeBadge != null)
                        {
                            AccountTypeBadge.Background = new SolidColorBrush(Color.FromRgb(255, 170, 0));
                        }

                        ShowNotification($"Лицензия: {session.Username}");
                        CloseAuthWithAnimation();
                        IsLicensed = true;
                        CurrentSession = session;

                        AppendLog($"[Auth] Успешный вход: {session.Username}", Brushes.Lime);
                        SaveSettings(); // Сохраняем сессию сразу после успеха
                    }
                });
            }
            catch (Exception ex)
            {
                Dispatcher.Invoke(() =>
                {
                    ShowNotification("Ошибка или отмена входа");
                    // Выводим конкретную ошибку в лог, чтобы понимать — это юзер закрыл окно или нет интернета
                    AppendLog($"[Auth] Сбой: {ex.Message}", Brushes.Yellow);
                });
            }
        }

        private async Task TrySilentLogin()
        {
            if (!IsLicensed) return;
            try
            {
                var loginHandler = new JELoginHandlerBuilder().Build();
                var session = await loginHandler.AuthenticateSilently();
                if (session != null)
                {
                    CurrentSession = session;
                    DisplayNick.Text = session.Username;
                    UserAvatarImg.ImageSource = new System.Windows.Media.Imaging.BitmapImage(new Uri($"https://minotar.net/helm/{session.Username}/45.png"));
                }
            }
            catch { IsLicensed = false; }
        }
        
        private void OpenLastCrashReport()
        {
            try
            {
                string dir = System.IO.Path.Combine(AppDataPath, "crash_reports");
                if (!Directory.Exists(dir))
                    return;

                var file = new DirectoryInfo(dir)
                    .GetFiles("crash_*.txt")
                    .OrderByDescending(f => f.CreationTime)
                    .FirstOrDefault();

                if (file != null)
                    Process.Start("explorer.exe", $"/select,\"{file.FullName}\"");
                else
                    Process.Start("explorer.exe", dir);
            }
            catch { }
        }
        private void LogJvmArguments(Process gameProcess)
        {
            try
            {
                SafeLog("[JVM] Параметры запуска:", Brushes.Gray);
                SafeLog(gameProcess.StartInfo.Arguments, Brushes.Gray);
            }
            catch { }
        }
        // --- ЗАПУСК ИГРЫ ---

        
        private async Task HandleGameCrashAsync(Process gameProcess)
        {
            SafeLog($"[CRASH] Код выхода: {gameProcess.ExitCode}", Brushes.OrangeRed);

            // 👇 ВСТАВИТЬ СЮДА
            string solution = gameProcess.ExitCode switch
            {
                1 => "Проверь Java и моды",
                -1 => "Недостаточно памяти",
                _ => "Посмотри логи"
            };

            var report = new CrashReport
            {
                Title = "Игра завершилась с ошибкой",
                Message = $"Код выхода: {gameProcess.ExitCode}",
                Solution = solution
            };
            // 👆 ДО ЭТОГО МЕСТА

            UI(() => ShowCrashDialog(report));

            if (!string.IsNullOrEmpty(report.Solution))
                SafeLog("[РЕШЕНИЕ] " + report.Solution, Brushes.LightBlue);

            await Task.CompletedTask;
        }
        private void ConfigureProcess(Process gameProcess, LaunchOptions opt)
        {
            bool console = ConsoleCheck.IsChecked == true;

            if (string.IsNullOrWhiteSpace(opt.JavaPath))
                throw new Exception("Java не подготовлена");

            if (!File.Exists(opt.JavaPath))
                throw new Exception("Файл Java не найден");

            if (console)
                opt.JavaPath = opt.JavaPath.Replace("javaw.exe", "java.exe");

            gameProcess.StartInfo.FileName = opt.JavaPath;
            gameProcess.StartInfo.UseShellExecute = false;
            gameProcess.StartInfo.CreateNoWindow = !console;
            gameProcess.StartInfo.RedirectStandardOutput = !console;
            gameProcess.StartInfo.RedirectStandardError = !console;
            gameProcess.StartInfo.RedirectStandardInput = !console;

            // 🔥 ВАЖНО — подписка на вывод
            if (!console)
            {
                gameProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrWhiteSpace(e.Data))
                        SafeLog(e.Data, Brushes.LightGray);
                };

                gameProcess.ErrorDataReceived += (s, e) =>
                {
                    if (string.IsNullOrWhiteSpace(e.Data)) return;

                    if (e.Data.Contains("Exception") ||
                        e.Data.Contains("ERROR") ||
                        e.Data.Contains("Failed"))
                    {
                        SafeLog("[JVM ERROR] " + e.Data, Brushes.OrangeRed);
                    }
                    else
                    {
                        SafeLog(e.Data, Brushes.LightGray);
                    }
                };
            }

            SafeLog("[JVM] Path: " + opt.JavaPath, Brushes.Gray);
            SafeLog("[JVM] RAM: " + opt.RamMb + " MB", Brushes.Gray);
            SafeLog("[JVM] Версия: " + JavaResolver.GetJavaMajorVersion(opt.JavaPath), Brushes.Gray);
        }
        private async Task StartGameAsync(Process gameProcess)
        {

            LogJvmArguments(gameProcess);

            gameProcess.Start();
           
            // 🔥 запуск чтения stdout/stderr
            bool console = ConsoleCheck.IsChecked == true;

            if (!console)
            {
                gameProcess.BeginOutputReadLine();
                gameProcess.BeginErrorReadLine();
            }

            await Task.Delay(1500);

            if (gameProcess.HasExited)
                throw new Exception($"JVM завершилась сразу после запуска (код {gameProcess.ExitCode})");

            SetGameRunningUI(true);
            SafeLog("[LAUNCH] Игра запущена", Brushes.LightGreen);
        }
        private void MonitorGame(Process gameProcess)
        {
            _gameProcess = gameProcess;
            gameProcess.EnableRaisingEvents = true;

            gameProcess.Exited += async (s, ev) =>
            {
                await Dispatcher.InvokeAsync(() =>
                {
                    SetGameRunningUI(false);
                });

                if (gameProcess.ExitCode != 0)
                {
                    await HandleGameCrashAsync(gameProcess);
                }
                else
                {
                    await Dispatcher.InvokeAsync(() =>
                    {
                        SafeLog("[LAUNCH] Игра закрыта", Brushes.Gray);
                    });
                }
            };
        }
        private async Task<string> ResolveJavaPathAsync(LaunchOptions opt, CancellationToken token)
        {
            int requiredJava = GetRequiredJavaMajor(opt.Version);

            // MANUAL
            if (_javaSource == JavaSourceType.Manual)
            {
                if (!string.IsNullOrWhiteSpace(_manualJavaPath) && File.Exists(_manualJavaPath))
                    return _manualJavaPath;

                throw new Exception("Java не выбрана вручную");
            }

            // SYSTEM
            if (_javaSource == JavaSourceType.System)
            {
                string? sys = FindSystemJava();

                if (!string.IsNullOrWhiteSpace(sys))
                    return sys;

                throw new Exception("Системная Java не найдена");
            }

            // BUNDLED (по умолчанию)
            // BUNDLED (по умолчанию)
            string? bundled = JavaResolver.GetExistingRuntime(requiredJava);

            if (!string.IsNullOrWhiteSpace(bundled))
            {
                SafeLog("[JAVA] Найдена установленная runtime", Brushes.LightGreen);
                return bundled;
            }

            SafeLog($"[JAVA] Требуется Java {requiredJava}", Brushes.Gray);
            SafeLog("[JAVA] Runtime не найдена, начинаю установку...", Brushes.Orange);

            var progress = new Progress<double>(p =>
            {
                StatusLabel.Text = $"Установка Java {Math.Round(p)}%";

                SafeLog($"[JAVA] Установка {Math.Round(p)}%", Brushes.LightBlue);
            });

            try
            {
                string path = await JavaResolver.EnsureBundledJavaAsync(
                    requiredJava,
                    progress,
                    token,
                    msg =>
                    {
                        SafeLog(msg, Brushes.Orange);
                        AppLogger.Log(msg);
                        if (msg.Contains("Попытка"))
                        {
                            Dispatcher.Invoke(() =>
                            {
                                StatusLabel.Text = "Проблемы с сетью, повтор...";
                            });
                        }
                    }
                );

                if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
                    throw new Exception("Установка Java завершилась без результата");

                SafeLog("[JAVA] Установка успешно завершена", Brushes.LightGreen);
                return path;
            }
            catch (Exception ex)
            {
                SafeLog("[JAVA] Ошибка установки: " + ex.Message, Brushes.OrangeRed);
                throw;
            }
        }
        public class LaunchProfile
        {
            public string Name { get; set; }
            public string Version { get; set; }
            public int RamMb { get; set; }
            public string? JavaPath { get; set; }
        }

        private async Task<Process> InstallGameAsync(LaunchOptions opt, CancellationToken token)
        {
            if (_isInstalling) throw new InvalidOperationException("Установка уже выполняется");
            _isInstalling = true;

            try
            {
                SetState(LauncherState.Downloading);
                StatusLabel.Text = "Подготовка игры...";

                var service = new LauncherService(AppDataPath, msg => SafeLog(msg, Brushes.Orange));

                // ⭐ Теперь эта ошибка исчезнет
                service.ProgressChanged += (s, e) =>
                {
                    Dispatcher.Invoke(() =>
                    {
                        MainProgressBar.IsIndeterminate = false;

                        // 1. Считаем процент заполнения сами
                        // Формула: (Выполнено / Всего) * 100
                        double percentage = 0;
                        if (e.TotalTasks > 0)
                        {
                            percentage = (double)e.ProgressedTasks / e.TotalTasks * 100;
                        }

                        // 2. Запускаем плавное заполнение полоски
                        DoubleAnimation smoothProgress = new DoubleAnimation
                        {
                            To = percentage,
                            Duration = TimeSpan.FromMilliseconds(450), // Время "доезда" полоски
                            EasingFunction = new QuadraticEase { EasingMode = EasingMode.EaseOut }
                        };

                        MainProgressBar.BeginAnimation(ProgressBar.ValueProperty, smoothProgress);

                        // 3. Обновляем текст (показываем и цифры, и проценты)
                        StatusLabel.Text = $"Загрузка: {e.ProgressedTasks}/{e.TotalTasks} ({(int)percentage}%)";
                    });
                };



                var process = await service.PrepareAndCreateProcessAsync(
                    opt.Version, opt, null, null, token);

                StatusLabel.Text = "Готово";
                SetState(LauncherState.Installing);

                return process;

            }
            catch (OperationCanceledException)
            {
                StatusLabel.Text = "Отменено";
                SetState(LauncherState.Canceled);
                throw;
            }
            catch (Exception ex)
            {
                StatusLabel.Text = "Ошибка установки";
                SafeLog(ex.Message, Brushes.Red);
                SetState(LauncherState.Error, ex.Message);
                throw;
            }
            finally
            {
                _isInstalling = false;
                // !!! ОТСЮДА УДАЛИЛИ PlayBtn.IsEnabled = true и SetVersionSelectionEnabled(true)
                // Мы перенесем их в Play_Click, чтобы они сработали ПОСЛЕ закрытия игры
            }
        }

        private async Task<string> PrepareJavaAsync(LaunchOptions opt, CancellationToken token)
        {
            PlayBtn.IsEnabled = false;

            int requiredJava = GetRequiredJavaMajor(opt.Version);

            var javaProgress = new Progress<double>(p =>
            {
                StatusLabel.Text = $"Подготовка Java {Math.Round(p)}%";
            });

            // ==============================
            // 1️⃣ MANUAL JAVA
            // ==============================
            if (!string.IsNullOrWhiteSpace(_manualJavaPath))
            {
                SafeLog("[JAVA] Проверка вручную выбранной Java...", Brushes.Gray);

                if (!File.Exists(_manualJavaPath))
                    throw new Exception("Указанный файл Java не найден");

                var ver = JavaResolver.GetJavaMajorVersion(_manualJavaPath);

                if (ver == null)
                    throw new Exception("Не удалось определить версию выбранной Java");

                if (ver < requiredJava)
                    throw new Exception($"Для версии {opt.Version} требуется Java {requiredJava}");

                SafeLog($"[JAVA] Используется ручная Java {ver}", Brushes.LightGreen);

                opt.JavaPath = _manualJavaPath;
                return _manualJavaPath;
            }

            // ==============================
            // 2️⃣ BUNDLED JAVA
            // ==============================
            SafeLog("[JAVA] Проверка встроенного runtime...", Brushes.Gray);

            string bundledPath = JavaResolver.GetBundledJavaPath(requiredJava);

            if (!string.IsNullOrWhiteSpace(bundledPath) && File.Exists(bundledPath))
            {
                var ver = JavaResolver.GetJavaMajorVersion(bundledPath);

                if (ver >= requiredJava)
                {
                    SafeLog($"[JAVA] Используется runtime Java {ver}", Brushes.LightGreen);
                    opt.JavaPath = bundledPath;
                    return bundledPath;
                }
            }

            // ==============================
            // 3️⃣ СКАЧИВАНИЕ
            // ==============================
            SafeLog($"[JAVA] Установка Java {requiredJava}...", Brushes.Orange);

            string javaPath = await JavaResolver.EnsureBundledJavaAsync(
                requiredJava,
                javaProgress,
                token,
                msg => SafeLog(msg, Brushes.Gray)
            );

            if (!File.Exists(javaPath))
                throw new Exception("Java установлена некорректно");

            var detected = JavaResolver.GetJavaMajorVersion(javaPath);
            if (detected < requiredJava)
                throw new Exception("Ошибка установки Java");

            SafeLog($"[JAVA] Установлена Java {detected}", Brushes.LightGreen);

            opt.JavaPath = javaPath;
            return javaPath;
        }
        public static string GetBundledJavaPath(int version)
        {
            string dir = System.IO.Path.Combine(RuntimeRoot, $"java{version}");
            string path = System.IO.Path.Combine(dir, "bin", "javaw.exe");
            return File.Exists(path) ? path : null;
        }
        public static string RuntimeRoot =>
    System.IO.Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "SubReel",
        "runtime"
    );
        private void SaveCrashReport(CrashReport report)
        {
            try
            {
                string dir = System.IO.Path.Combine(AppDataPath, "crash_reports");

                if (!Directory.Exists(dir))
                    Directory.CreateDirectory(dir);

                string file = System.IO.Path.Combine(dir, $"crash_{DateTime.Now:yyyyMMdd_HHmmss}.txt");

                File.WriteAllText(file, report.FullText);

                SafeLog("[CRASH] Отчёт сохранён: " + file, Brushes.Orange);
            }
            catch (Exception ex)
            {
                SafeLog("[CRASH] Ошибка сохранения: " + ex.Message, Brushes.Red);
            }
        }
        private string? DiagnoseLaunchEnvironment(LaunchOptions opt, string gamePath)
        {
            if (string.IsNullOrWhiteSpace(opt.JavaPath))
                return "Не найден путь к Java";

            if (!File.Exists(opt.JavaPath))
                return "Java отсутствует на диске";

            var javaVer = JavaResolver.GetJavaMajorVersion(opt.JavaPath);
            if (javaVer == null)
                return "Не удалось определить версию Java";

            int required = GetRequiredJavaMajor(opt.Version);
            if (javaVer < required)
                return $"Требуется Java {required}, найдена {javaVer}";

            if (opt.RamMb < 1024)
                return "Выделено слишком мало RAM";

            if (!Directory.Exists(gamePath))
                return "Папка игры не существует";

            if (IsGameAlreadyRunning())
                return "Игра уже запущена";

            return null;
        }
        private void LogStep(string message)
        {
            Log("[STEP] " + message);
        }
        private void CancelJavaDownload_Click(object sender, RoutedEventArgs e)
        {
            _javaDownloadCts?.Cancel();
        }
        private bool IsGameAlreadyRunning()
        {
            return _gameProcess != null && !_gameProcess.HasExited;
        }
        



        private string? _manualJavaPath;
        private void SaveLogToFile(string fileName)
        {
            try
            {
                string logFolder = System.IO.Path.Combine(AppDataPath, "logs");
                if (!Directory.Exists(logFolder)) Directory.CreateDirectory(logFolder);

                // Чистим старые логи (оставляем последние 5), чтобы не забивать диск
                var files = new DirectoryInfo(logFolder).GetFiles("crash_*.txt")
                .OrderBy(f => f.CreationTime).ToList();

                if (files.Count > 5)
                    files[0].Delete();

                string fullPath = System.IO.Path.Combine(logFolder, fileName);

                var fullLog = new System.Text.StringBuilder();
                foreach (var inline in LogText.Inlines)
                {
                    if (inline is System.Windows.Documents.Run run) fullLog.Append(run.Text);
                    else if (inline is System.Windows.Documents.LineBreak) fullLog.AppendLine();
                }

                File.WriteAllText(fullPath, fullLog.ToString());
            }
            catch (Exception ex)
            {
                SafeLog($"[System] Не удалось сохранить файл лога: {ex.Message}", Brushes.Red);
            }
        }
        
        

        private void CleanMemory()
        {
            try
            {
                // 1. Собираем весь неиспользуемый мусор во всех поколениях (0, 1, 2)
                GC.Collect();
                // 2. Ожидаем завершения всех фоновых задач по очистке
                GC.WaitForPendingFinalizers();
                // 3. Еще раз проходим сборщиком для закрепления результата
                GC.Collect();

                SafeLog("[System] Очистка памяти завершена.", Brushes.Gray);
            }
            catch { }
        }

        // Вспомогательный метод для визуального переключения в Оффлайн
        private void SetOfflineStatus()
        {
            Dispatcher.Invoke(() => {
                if (OnlineCount != null) OnlineCount.Text = "OFFLINE";
                if (OnlineCircle != null) OnlineCircle.Fill = Brushes.Gray;
                if (UpdateBadge != null) UpdateBadge.Visibility = Visibility.Collapsed;
            });
        }
        private void WriteLauncherLogToFile(string message)
        {
            try
            {
                string logDir = System.IO.Path.Combine(AppDataPath, "launcher_logs");
                if (!Directory.Exists(logDir))
                    Directory.CreateDirectory(logDir);

                string file = System.IO.Path.Combine(
                    logDir,
                    $"launcher_{DateTime.Now:yyyyMMdd}.log"
                );

                File.AppendAllText(file,
                    $"[{DateTime.Now:HH:mm:ss}] {message}{Environment.NewLine}");
            }
            catch { }
        }
        private void OpenCrashFolder()
        {
            try
            {
                string dir = System.IO.Path.Combine(AppDataPath, "crash_reports");

                if (!Directory.Exists(dir))
                    Directory.CreateDirectory(dir);

                var file = new DirectoryInfo(dir)
                    .GetFiles("crash_*.txt")
                    .OrderByDescending(f => f.CreationTime)
                    .FirstOrDefault();

                if (file != null)
                    Process.Start("explorer.exe", $"/select,\"{file.FullName}\"");
                else
                    Process.Start("explorer.exe", dir);
            }
            catch (Exception ex)
            {
                SafeLog("[CRASH] Не удалось открыть папку: " + ex.Message, Brushes.Red);
            }
        }
        private void Log(string text)
        {
            LogText.Text += $"[{DateTime.Now:HH:mm:ss}] {text}\n";
            LogScroll.ScrollToEnd();
        }

    }
}

using CmlLib.Core.VersionMetadata;
using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Effects;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Windows.Threading;
using System.Collections.ObjectModel;
using System.Linq;
using SubReel.Models;
#nullable enable

namespace SubReel
{

    public partial class MainWindow : Window
    {
        public ObservableCollection<BuildModel> FavoriteBuilds { get; set; } = new();
        public ObservableCollection<BuildModel> CustomBuilds { get; set; } = new();
        private LauncherState _state = LauncherState.Idle;
        private bool _isProcessingNotifications = false;
        private Random _rnd = new Random();
        private async Task<CrashReport?> AnalyzeCrashAsync()
        {
            try
            {
                string logFile = System.IO.Path.Combine(AppDataPath, "launcher_logs", "latest.log");

                if (!File.Exists(logFile))
                    return null;

                string text = await File.ReadAllTextAsync(logFile);

                if (text.Contains("OutOfMemoryError"))
                    return new CrashReport { Title = "Недостаточно памяти", FullText = text };

                if (text.Contains("Unable to locate Java runtime"))
                    return new CrashReport { Title = "Java не найдена", FullText = text };

                if (text.Contains("EXCEPTION_ACCESS_VIOLATION"))
                    return new CrashReport { Title = "Сбой JVM", FullText = text };

                return null;
            }
            catch
            {
                return null;
            }
        }
        
        

        private string NewsCachePath => System.IO.Path.Combine(AppDataPath, "news_cache.json");

        

        // --- НАВИГАЦИЯ И ПАНЕЛИ ---
        // 1. Улучшаем твой SwitchTab, чтобы он прятал ВСЕ страницы
        private void SwitchTab(FrameworkElement panel)
        {
            // Определяем текущую вкладку
            if (panel == BuildsPanel) _currentTab = "home";
            else if (panel == SettingsPanel) _currentTab = "settings";
            else if (panel == CreateBuildPage) _currentTab = "create"; // <--- Добавили
            else if (panel == NewsPanel) _currentTab = "news";
            else _currentTab = "other";

            // Скрываем абсолютно все панели (включая контейнер главной страницы)
            if (MainPageContent != null) MainPageContent.Visibility = Visibility.Collapsed;
            if (BuildsPanel != null) BuildsPanel.Visibility = Visibility.Collapsed;
            if (SettingsPanel != null) SettingsPanel.Visibility = Visibility.Collapsed;
            if (NewsPanel != null) NewsPanel.Visibility = Visibility.Collapsed;
            if (CommunityPanel != null) CommunityPanel.Visibility = Visibility.Collapsed;
            if (CreateBuildPage != null) CreateBuildPage.Visibility = Visibility.Collapsed;
            if (BuildSettingsPage != null) BuildSettingsPage.Visibility = Visibility.Collapsed;
            // Показываем нужную
            panel.Visibility = Visibility.Visible;

            // Если это страница создания, убеждаемся, что её родитель (MainPageContent) тоже виден, 
            // ЕСЛИ она находится внутри него. Если она лежит в корне — просто показываем её.

            SetActiveMenuButton();

            if (Resources["FadeIn"] is Storyboard sb)
                sb.Begin(panel);
        }


        private void ShowPanel(FrameworkElement panelToShow)
        {
            SwitchTab(panelToShow);
        }

        
    
        private void RestoreLastTab()
        {
            switch (_currentTab)
            {
                case "settings": SwitchTab(SettingsPanel); break;
                case "news": SwitchTab(NewsPanel); break;
                case "community": SwitchTab(CommunityPanel); break;
                default: SwitchTab(BuildsPanel); break;
            }
        }

        // Копирование логов в буфер обмена
        private void CopyLogs_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (LogText == null || LogText.Inlines.Count == 0)
                {
                    ShowNotification("Лог пуст");
                    return;
                }

                // Используем StringBuilder для эффективной сборки большого текста
                var fullLog = new System.Text.StringBuilder();

                // Проходим по всем кусочкам текста (Run) в TextBlock
                foreach (var inline in LogText.Inlines)
                {
                    if (inline is System.Windows.Documents.Run run)
                    {
                        fullLog.Append(run.Text);
                    }
                    else if (inline is System.Windows.Documents.LineBreak)
                    {
                        fullLog.AppendLine();
                    }
                }

                string result = fullLog.ToString();

                if (!string.IsNullOrEmpty(result))
                {
                    Clipboard.SetText(result);
                    ShowNotification("Весь лог скопирован в буфер!");
                }
            }
            catch (Exception ex)
            {
                ShowNotification("Ошибка копирования");
                // Записываем ошибку в сам лог, чтобы понять, что пошло не так
                SafeLog($"[System] Ошибка буфера обмена: {ex.Message}", Brushes.Red);
            }
        }

                private void UpdateSidebarSelection(Button selectedButton)
        {
            // Список всех ваших кнопок в боковом меню
            var buttons = new[] { BtnBuilds, BtnCommunity, BtnNews, BtnSettings };

            foreach (var btn in buttons)
            {
                btn.Tag = null; // Сбрасываем выделение у всех
            }

            selectedButton.Tag = "Active"; // Выделяем нажатую
        }

        // 1. Переход с Главной на страницу Создания
        // 1. Вход в меню создания (нажимаем "Создать" в главном меню)
        

        // 2. Выбор конкретного типа (Custom, Modrinth и т.д.)
        

        // 3. Кнопка "Назад" внутри конструктора (возврат к плиткам)
        
        
        private void BackToBuilds_Click(object sender, RoutedEventArgs e)
        {
            BackToMain_Click(sender, e);
        }

        private BuildModel _currentEditingBuild;
        private void OpenBuildFolder_Click(object sender, RoutedEventArgs e)
        {
            if (_currentEditingBuild != null)
            {
                // Логика открытия папки через Process.Start
                string path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "builds", _currentEditingBuild.Name);
                if (System.IO.Directory.Exists(path))
                    System.Diagnostics.Process.Start("explorer.exe", path);
            }
        }
        // Это метод для кнопки "Играть" ВНУТРИ страницы настроек сборки
        private void PlaySelectedBuild_Click(object sender, RoutedEventArgs e)
        {
            if (_currentEditingBuild == null) return;

            _selectedBuild = _currentEditingBuild;
            Play_Click(sender, e);
        }

        private void OpenModsFolder_Click(object sender, RoutedEventArgs e)
        {
            if (_currentEditingBuild == null) return;
            string path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "builds", _currentEditingBuild.Name, "mods");
            SafeOpenFolder(path);
        }

        private void OpenClientFolder_Click(object sender, RoutedEventArgs e)
        {
            if (_currentEditingBuild == null) return;
            string path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "builds", _currentEditingBuild.Name);
            SafeOpenFolder(path);
        }
        public static void DeleteBuild(BuildModel build) {
    // Логика удаления из списка
}
        private BuildModel? _selectedBuild;
        private void DeleteBuild_Click(object sender, RoutedEventArgs e)
        {
            if (_currentEditingBuild == null) return;

            var result = System.Windows.MessageBox.Show(
                $"Вы уверены, что хотите удалить сборку '{_currentEditingBuild.Name}'?\nВсе файлы (моды, миры, скриншоты) будут стерты без возможности восстановления.",
                "Подтверждение удаления",
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);

            if (result == MessageBoxResult.Yes)
            {
                string buildPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "builds", _currentEditingBuild.Name);

                try
                {
                    if (System.IO.Directory.Exists(buildPath))
                    {
                        System.IO.Directory.Delete(buildPath, true); // true = удалить со всеми вложенными файлами
                    }

                    BuildManager.DeleteBuild(_currentEditingBuild);
                    RefreshBuildsUI();

                    ShowNotification("СБОРКА УДАЛЕНА");
                    SafeLog($"[SYSTEM] Сборка {_currentEditingBuild.Name} полностью удалена.", System.Windows.Media.Brushes.IndianRed);

                    BackToMain_Click(null, null); // Возвращаемся на главный экран
                }
                catch (Exception ex)
                {
                    ShowNotification("ОШИБКА ПРИ УДАЛЕНИИ!");
                    SafeLog($"[ERROR] Файлы заняты другим процессом: {ex.Message}", System.Windows.Media.Brushes.Red);
                }
            }
        }

        private void Tab_Checked(object sender, RoutedEventArgs e)
        {
            // Проверка на null всех вкладок
            if (TabMain == null || TabSettings == null || TabResourcePacks == null ||
                TabWorlds == null || TabMods == null || TabScrin == null) return;

            var rb = sender as RadioButton;
            if (rb == null || rb.Tag == null) return;

            // Скрываем абсолютно все вкладки перед показом нужной
            TabMain.Visibility = Visibility.Collapsed;
            TabSettings.Visibility = Visibility.Collapsed;
            TabResourcePacks.Visibility = Visibility.Collapsed;
            TabWorlds.Visibility = Visibility.Collapsed;
            TabMods.Visibility = Visibility.Collapsed;
            TabScrin.Visibility = Visibility.Collapsed;

            // Показываем нужную по Tag, который прописан в RadioButton в XAML
            switch (rb.Tag.ToString())
            {
                case "Main": TabMain.Visibility = Visibility.Visible; break;
                case "Settings": TabSettings.Visibility = Visibility.Visible; break;
                case "ResourcePacks": TabResourcePacks.Visibility = Visibility.Visible; break;
                case "Worlds": TabWorlds.Visibility = Visibility.Visible; break;
                case "Mods": TabMods.Visibility = Visibility.Visible; break; // Была ошибка тут
                case "SCrin": TabScrin.Visibility = Visibility.Visible; break; // И тут (регистр важен!)
            }
        }
        // Вспомогательный метод для безопасного открытия папок
        private void SafeOpenFolder(string folderPath)
        {
            try
            {
                // Если папки нет — создаем её, чтобы не было ошибки
                if (!System.IO.Directory.Exists(folderPath))
                {
                    System.IO.Directory.CreateDirectory(folderPath);
                }
                System.Diagnostics.Process.Start("explorer.exe", folderPath);
            }
            catch (Exception ex)
            {
                ShowNotification("ОШИБКА ОТКРЫТИЯ ПАПКИ!");
                SafeLog($"[ERROR] Ошибка при открытии папки {folderPath}: {ex.Message}", System.Windows.Media.Brushes.Red);
            }
        }

        private void CreateBtnServer_Click(object sender, RoutedEventArgs e)
        {
            ShowNotification("Этот раздел находится в разработке!");
        }

        
        // Обработчик поиска
        // Для клика по самой карточке (открытие)

        // Исправленная анимация (принимает FrameworkElement для доступа к свойствам анимации)
        private void ShowPanelWithAnimation(FrameworkElement panel)
        {
            if (panel == null) return;

            panel.Visibility = Visibility.Visible;
            panel.Opacity = 0; // Сбрасываем перед началом

            var sb = new Storyboard();

            // Анимация прозрачности
            var fade = new DoubleAnimation(0, 1, TimeSpan.FromMilliseconds(350));
            Storyboard.SetTargetProperty(fade, new PropertyPath("Opacity"));

            // Анимация движения
            var move = new DoubleAnimation(20, 0, TimeSpan.FromMilliseconds(350))
            {
                EasingFunction = new QuarticEase { EasingMode = EasingMode.EaseOut }
            };

            // Важно: убедись, что в XAML у NewsPanel прописан <Grid.RenderTransform><TranslateTransform/></Grid.RenderTransform>
            Storyboard.SetTargetProperty(move,
                new PropertyPath("(UIElement.RenderTransform).(TranslateTransform.Y)"));

            sb.Children.Add(fade);
            sb.Children.Add(move);

            Storyboard.SetTarget(fade, panel);
            Storyboard.SetTarget(move, panel);

            sb.Begin();
        }

        // --- ЧАТ И ПРОЧЕЕ ---
        
        
        private string GetCrashHelp(string reason)
        {
            if (reason.Contains("RAM"))
                return "Попробуй увеличить выделенную память в настройках.";

            if (reason.Contains("Java"))
                return "Переустанови Java через настройки лаунчера.";

            if (reason.Contains("видеодрайвера"))
                return "Обнови драйвер видеокарты.";

            if (reason.Contains("Повреждены файлы"))
                return "Перезапусти лаунчер для повторной загрузки файлов.";

            return "Посмотри crash-лог для подробностей.";
        }

        private void ReportProgress(
    double percent,
    string stage,
    string details,
    bool indeterminate = false)
        {

        }
    

        private string FormatBytes(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;

            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len /= 1024;
            }

            return $"{len:0.##} {sizes[order]}";
        }
        
    
    }
}

#nullable enable
using System;
using System.Net.Http;
using System.Threading.Tasks;



    // 🔥 ДЛЯ Task без результата
    public static async Task RetryAsync(
        Func<Task> action,
        int attempts = 3,
        int delayMs = 1500,
        Action<string>? log = null)
    {
        Exception? lastError = null;

        for (int i = 1; i <= attempts; i++)
        {
            try
            {
                await action();
                return;
            }
            catch (Exception ex) when (
                ex is HttpRequestException ||
                ex is TaskCanceledException)
            {
                lastError = ex;
                log?.Invoke($"Попытка {i}/{attempts}");

                if (i < attempts)
                    await Task.Delay(delayMs);
            }
        }

        throw lastError!;
    }



<UserControl x:Class="SubReelLauncher.Presentation.Views.Controls.NotificationBox"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="200" d:DesignWidth="400"
             IsHitTestVisible="False">
    <Canvas x:Name="NotificationCanvas">
        <Border x:Name="NotificationToast"
                Width="320" MinHeight="65" Padding="0,15"
                Background="{StaticResource CardBg}"
                CornerRadius="16" BorderThickness="2"
                BorderBrush="{StaticResource AccentBlue}"
                Canvas.Left="40" Canvas.Top="-100"
                Opacity="0" RenderTransformOrigin="0.5,0.5">
            <Border.RenderTransform>
                <ScaleTransform ScaleX="1" ScaleY="1"/>
            </Border.RenderTransform>
            <Border.Effect>
                <DropShadowEffect Color="{Binding Color, Source={StaticResource AccentBlue}}"
                                  BlurRadius="10" Opacity="0.5" ShadowDepth="0"/>
            </Border.Effect>
            <Grid Margin="15,0">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="Auto"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <Ellipse Width="10" Height="10" Fill="{StaticResource AccentBlue}"
                         VerticalAlignment="Center" Margin="0,0,15,0">
                    <Ellipse.Effect>
                        <BlurEffect Radius="4"/>
                    </Ellipse.Effect>
                </Ellipse>
                <TextBlock x:Name="NotificationText" Grid.Column="1"
                           Text="Уведомление 1" Foreground="White"
                           FontSize="13" FontWeight="SemiBold"
                           VerticalAlignment="Center" TextWrapping="Wrap"/>
            </Grid>
        </Border>

        <Border x:Name="NotificationToast2"
                Width="320" MinHeight="65" Padding="0,15"
                Background="{StaticResource CardBg}"
                CornerRadius="16" BorderThickness="2"
                BorderBrush="{StaticResource AccentBlue}"
                Canvas.Left="40" Canvas.Top="-100"
                Opacity="0" RenderTransformOrigin="0.5,0.5">
            <Border.RenderTransform>
                <ScaleTransform ScaleX="1" ScaleY="1"/>
            </Border.RenderTransform>
            <Border.Effect>
                <DropShadowEffect Color="{Binding Color, Source={StaticResource AccentBlue}}"
                                  BlurRadius="10" Opacity="0.5" ShadowDepth="0"/>
            </Border.Effect>
            <Grid Margin="15,0">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="Auto"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>
                <Ellipse Width="10" Height="10" Fill="{StaticResource AccentBlue}"
                         VerticalAlignment="Center" Margin="0,0,15,0">
                    <Ellipse.Effect>
                        <BlurEffect Radius="4"/>
                    </Ellipse.Effect>
                </Ellipse>
                <TextBlock x:Name="NotificationText2" Grid.Column="1"
                           Text="Уведомление 2" Foreground="White"
                           FontSize="13" FontWeight="SemiBold"
                           VerticalAlignment="Center" TextWrapping="Wrap"/>
            </Grid>
        </Border>
    </Canvas>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Controls.SidebarControl"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             xmlns:local="clr-namespace:SubReelLauncher.Presentation.Views.Controls"
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="220">

    <Border Background="#0A0A0E" CornerRadius="20,0,0,20" BorderThickness="0,0,2,0" BorderBrush="{StaticResource BorderSharp}">
        <DockPanel Margin="0,40,0,25">
            <StackPanel DockPanel.Dock="Top" HorizontalAlignment="Center">
                <Grid x:Name="ProfileRegion" Cursor="Hand" MouseLeftButtonDown="ProfileRegion_Click" Background="Transparent" Margin="0,0,0,30">
                    <StackPanel>
                        <Grid Width="75" Height="75" HorizontalAlignment="Center">
                            <Ellipse Fill="#14151B" Stroke="{StaticResource AccentBlue}" StrokeThickness="2.5">
                                <Ellipse.Effect>
                                    <DropShadowEffect Color="#3374FF" BlurRadius="20" ShadowDepth="0" Opacity="0.4" RenderingBias="Performance"/>
                                </Ellipse.Effect>
                            </Ellipse>
                            <Border Width="48" Height="48" CornerRadius="8" HorizontalAlignment="Center" VerticalAlignment="Center">
                                <Border.Background>
                                    <ImageBrush x:Name="UserAvatarImg" RenderOptions.BitmapScalingMode="NearestNeighbor"/>
                                </Border.Background>
                            </Border>
                        </Grid>

                        <TextBlock x:Name="DisplayNick" Text="Player" Foreground="White" FontSize="16" FontWeight="Black" HorizontalAlignment="Center" Margin="0,15,0,0"/>

                        <Border x:Name="AccountTypeBadge" Background="#1AFFFFFF" CornerRadius="6" HorizontalAlignment="Center" Margin="0,8,0,0" Padding="12,4">
                            <TextBlock x:Name="AccountTypeStatus" Text="OFFLINE" Foreground="#FFA500" FontSize="10" VerticalAlignment="Center" FontWeight="Bold"/>
                        </Border>

                        <TextBlock x:Name="AppVersionText" Text="v0.1.2" Foreground="#444" FontSize="9" FontWeight="Black" HorizontalAlignment="Center" Margin="0,6,0,0" Opacity="0.6" Cursor="Hand" MouseLeftButtonDown="AppVersionText_Click"/>
                    </StackPanel>
                </Grid>
            </StackPanel>

            <Border Name="UpdateBadge" DockPanel.Dock="Bottom" Visibility="Collapsed" Background="#FFCC00" CornerRadius="12" Padding="15,10" HorizontalAlignment="Center" Margin="0,20,0,0" Cursor="Hand" MouseLeftButtonDown="UpdateBadge_Click" RenderTransformOrigin="0.5,0.5">
                <Border.RenderTransform>
                    <ScaleTransform ScaleX="1" ScaleY="1"/>
                </Border.RenderTransform>
                <Border.Effect>
                    <DropShadowEffect Color="#FFCC00" BlurRadius="15" ShadowDepth="0" Opacity="0.5" RenderingBias="Performance"/>
                </Border.Effect>
                <TextBlock Name="LauncherVersionText" Text="ОБНОВЛЕНИЕ" FontSize="11" FontWeight="Black" Foreground="Black" IsHitTestVisible="False"/>
            </Border>

            <StackPanel VerticalAlignment="Top">
                <StackPanel Width="190" HorizontalAlignment="Center">
                    <Button x:Name="BtnBuilds" Content="СБОРКИ" Style="{StaticResource SidebarButtonStyle}" Click="BackToBuilds_Click" Tag="Active"/>
                    <Button x:Name="BtnCommunity" Content="СООБЩЕСТВО" Style="{StaticResource SidebarButtonStyle}" Click="CommunityBtn_Click"/>
                    <Button x:Name="BtnNews" Content="НОВОСТИ" Style="{StaticResource SidebarButtonStyle}" Click="NewsBtn_Click"/>
                    <Button x:Name="BtnSettings" Content="НАСТРОЙКИ" Style="{StaticResource SidebarButtonStyle}" Click="SettingsBtn_Click"/>
                </StackPanel>
            </StackPanel>
        </DockPanel>
    </Border>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Controls.StatusBarControl"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="80" d:DesignWidth="880">

    <Grid VerticalAlignment="Center" Margin="25,0">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*"/>
            <ColumnDefinition Width="190"/>
        </Grid.ColumnDefinitions>

        <Grid Margin="0,0,25,0" VerticalAlignment="Center">
            <Grid.RowDefinitions>
                <RowDefinition Height="Auto"/>
                <RowDefinition Height="Auto"/>
            </Grid.RowDefinitions>

            <Grid Grid.Row="0">
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="Auto"/>
                    <ColumnDefinition Width="Auto"/>
                    <ColumnDefinition Width="Auto"/>
                    <ColumnDefinition Width="*"/>
                    <ColumnDefinition Width="Auto"/>
                </Grid.ColumnDefinitions>

                <TextBlock x:Name="StatusLabel" Text="Готов к запуску" Foreground="White"
                           FontSize="12" FontWeight="Bold" VerticalAlignment="Center"/>

                <TextBlock x:Name="ConsoleIndicator" Grid.Column="1" Text="CONSOLE ON"
                           Foreground="#78C8FF" FontSize="11" Margin="10,0,0,0"
                           Visibility="Collapsed" VerticalAlignment="Center"/>

                <TextBlock x:Name="SelectedVersionBottom" Grid.Column="2" Text="Vanilla 1.21.1"
                           Foreground="#999" FontSize="11" Margin="10,0,0,0" VerticalAlignment="Center"/>

                <StackPanel Grid.Column="3" Orientation="Horizontal" HorizontalAlignment="Right"
                            Margin="20,0,0,0" VerticalAlignment="Center">
                    <Ellipse x:Name="OnlineCircle" Width="8" Height="8" Fill="Gray" Margin="0,0,6,0"/>
                    <TextBlock x:Name="OnlineCount" Text="OFFLINE" Foreground="#AAA" FontSize="11"/>
                </StackPanel>

                <Button x:Name="CancelDownloadBtn" Grid.Column="4" Content="ОТМЕНИТЬ"
                        Margin="15,0,0,0" VerticalAlignment="Center" Visibility="Collapsed"
                        Click="CancelDownload_Click"/>
            </Grid>

            <ProgressBar x:Name="MainProgressBar" Grid.Row="1" Height="6" Margin="0,6,0,0"
                         Minimum="0" Maximum="100" Value="0" Visibility="Collapsed"
                         Background="#1AFFFFFF" BorderThickness="0">
                <ProgressBar.Template>
                    <ControlTemplate TargetType="ProgressBar">
                        <Grid>
                            <Border Background="{TemplateBinding Background}" CornerRadius="3"/>
                            <Border x:Name="PART_Indicator" HorizontalAlignment="Left" CornerRadius="3" 
                                    Background="{StaticResource AccentBlue}">
                                <Border.Effect>
                                    <DropShadowEffect Color="#78C8FF" BlurRadius="10" ShadowDepth="0" Opacity="0.7"/>
                                </Border.Effect>
                            </Border>
                        </Grid>
                    </ControlTemplate>
                </ProgressBar.Template>
            </ProgressBar>
        </Grid>

        <Grid Grid.Column="1">
            <Border Background="{StaticResource AccentBlue}" CornerRadius="18" Opacity="0.4" IsHitTestVisible="False">
                <Border.Effect>
                    <BlurEffect Radius="25"/>
                </Border.Effect>
            </Border>

            <Button x:Name="PlayBtn" Panel.ZIndex="5" Height="60" VerticalAlignment="Center"
                    Content="ИГРАТЬ" Click="Play_Click"
                    Style="{StaticResource AnimatedAccentPlayButtonStyle}"/>

            <Button x:Name="CancelBtn" Panel.ZIndex="5" Content="ОТМЕНИТЬ"
                    Click="CancelDownload_Click" Visibility="Collapsed"
                    Style="{StaticResource AnimatedAccentPlayButtonStyle}" Background="Red"/>
        </Grid>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Controls.Overlays.AuthOverlay"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1100">

    <Grid x:Name="AuthRoot">
        <Border Background="#000000" Opacity="0.85" MouseLeftButtonDown="AuthOverlay_Close"/>

        <Border x:Name="AuthChild" Width="340" VerticalAlignment="Center" HorizontalAlignment="Center" 
                Background="{StaticResource CardBg}" CornerRadius="20" BorderThickness="2" 
                BorderBrush="{StaticResource AccentBlue}" RenderTransformOrigin="0.5,0.5">
            <Border.RenderTransform>
                <ScaleTransform ScaleX="1" ScaleY="1"/>
            </Border.RenderTransform>

            <StackPanel Margin="30">
                <TextBlock Text="АВТОРИЗАЦИЯ" Foreground="White" FontWeight="Black" FontSize="18" 
                           HorizontalAlignment="Center" Margin="0,0,0,25"/>

                <TextBlock Text="Ваш никнейм" Foreground="{StaticResource TextGray}" 
                           FontSize="12" FontWeight="Bold" Margin="5,0,0,8"/>

                <TextBox x:Name="NicknameBox" Text="Player" Background="#08080A" Foreground="White" 
                         BorderThickness="1.5" BorderBrush="{StaticResource BorderSharp}" 
                         Padding="12" FontSize="16" FontWeight="Bold" CaretBrush="{StaticResource AccentBlue}" 
                         MaxLength="16" PreviewTextInput="NicknameBox_PreviewTextInput" 
                         TextChanged="NicknameBox_TextChanged">
                    <TextBox.Resources>
                        <Style TargetType="{x:Type Border}">
                            <Setter Property="CornerRadius" Value="10"/>
                        </Style>
                    </TextBox.Resources>
                </TextBox>

                <Button Content="ПРИМЕНИТЬ" Click="SaveAuth_Click" Margin="0,20,0,0" Height="50" 
                        Background="{StaticResource AccentBlue}" Foreground="White" FontWeight="Black" FontSize="14">
                    <Button.Template>
                        <ControlTemplate TargetType="Button">
                            <Border x:Name="BtnBorder" Background="{TemplateBinding Background}" CornerRadius="15">
                                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                            </Border>
                            <ControlTemplate.Triggers>
                                <Trigger Property="IsMouseOver" Value="True">
                                    <Setter TargetName="BtnBorder" Property="Background" Value="#3374FF"/>
                                </Trigger>
                            </ControlTemplate.Triggers>
                        </ControlTemplate>
                    </Button.Template>
                </Button>

                <TextBlock Text="или" Foreground="{StaticResource TextGray}" 
                           HorizontalAlignment="Center" Margin="0,15,0,15" FontSize="12"/>

                <Button x:Name="MSLoginBtn" Content="ВОЙТИ ЧЕРЕЗ MICROSOFT" Click="MSLogin_Click" 
                        Height="45" Background="#2D2D2D" Foreground="White" FontWeight="Bold" FontSize="12">
                    <Button.Template>
                        <ControlTemplate TargetType="Button">
                            <Border x:Name="MSBorder" Background="{TemplateBinding Background}" 
                                    CornerRadius="12" BorderThickness="1" BorderBrush="#444">
                                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                            </Border>
                            <ControlTemplate.Triggers>
                                <Trigger Property="IsMouseOver" Value="True">
                                    <Setter TargetName="MSBorder" Property="Background" Value="#3D3D3D"/>
                                </Trigger>
                            </ControlTemplate.Triggers>
                        </ControlTemplate>
                    </Button.Template>
                </Button>
            </StackPanel>
        </Border>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Controls.Overlays.CrashOverlay"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1100">

    <Grid x:Name="CrashRoot">
        <Border Background="#000000" Opacity="0.85"/>

        <Border Width="460" VerticalAlignment="Center" HorizontalAlignment="Center" 
                Background="{StaticResource CardBg}" CornerRadius="25" 
                BorderThickness="2" BorderBrush="#FF4444">

            <StackPanel Margin="30">
                <TextBlock Text="ОШИБКА ЗАПУСКА" Foreground="#FF4444" 
                           FontWeight="Black" FontSize="20" 
                           HorizontalAlignment="Center" Margin="0,0,0,15"/>

                <TextBlock x:Name="CrashReasonText" Text="Игра неожиданно завершилась (Exit Code: 1)" 
                           Foreground="White" FontSize="14" TextWrapping="Wrap" 
                           TextAlignment="Center" Margin="0,0,0,20"/>

                <Border Background="#08080A" CornerRadius="12" Padding="15" 
                        BorderThickness="1" BorderBrush="#1A1B23" Margin="0,0,0,20">
                    <TextBlock x:Name="CrashHelpText" 
                               Text="Попробуйте обновить драйверы видеокарты или выделить больше оперативной памяти в настройках." 
                               Foreground="#AAA" FontSize="12" TextWrapping="Wrap"/>
                </Border>

                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                    <Button Content="ОТКРЫТЬ ЛОГИ" Width="150" Margin="5" 
                            Click="OpenLogsFolder_Click" Style="{StaticResource SecondaryButtonStyle}"/>

                    <Button Content="ЗАКРЫТЬ" Width="120" Margin="5" 
                            Click="CloseCrashOverlay_Click" Style="{StaticResource SecondaryButtonStyle}"/>
                </StackPanel>
            </StackPanel>
        </Border>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLaumcher.Presentation.Views.Controls.Overlays.WelcomeOverlay"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1100">

    <Grid x:Name="WelcomeRoot">
        <Border Background="#000000" Opacity="0.85" MouseLeftButtonDown="CloseWelcome_Click"/>

        <Border x:Name="WelcomeChild" Width="420" VerticalAlignment="Center" HorizontalAlignment="Center" 
                Background="{StaticResource CardBg}" CornerRadius="25" BorderThickness="2" 
                BorderBrush="{StaticResource AccentBlue}" RenderTransformOrigin="0.5,0.5">
            <Border.RenderTransform>
                <ScaleTransform ScaleX="0.9" ScaleY="0.9"/>
            </Border.RenderTransform>

            <StackPanel Margin="35">
                <Grid HorizontalAlignment="Center" Margin="0,0,0,25">
                    <Ellipse Width="70" Height="70" Fill="{StaticResource AccentBlue}" Opacity="0.15"/>
                    <TextBlock Text="!" Foreground="{StaticResource AccentBlue}" FontSize="34" 
                               FontWeight="Black" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                </Grid>

                <TextBlock x:Name="WelcomeTitle" Text="ДОБРО ПОЖАЛОВАТЬ" Foreground="White" 
                           FontWeight="Black" FontSize="22" TextAlignment="Center" 
                           TextWrapping="Wrap" Margin="0,0,0,12"/>

                <TextBlock x:Name="WelcomeMessage" Text="Мы рады видеть вас в новом интерфейсе SubReel Studio." 
                           Foreground="{StaticResource TextGray}" FontSize="14" TextWrapping="Wrap" 
                           TextAlignment="Center" LineHeight="20" Margin="0,0,0,22"/>

                <Border Background="#1AFFFFFF" CornerRadius="14" Padding="18" Margin="0,0,0,28">
                    <Grid HorizontalAlignment="Center">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="Auto"/>
                            <ColumnDefinition Width="*"/>
                        </Grid.ColumnDefinitions>
                        <TextBlock Grid.Column="0" Text="⚙" Foreground="{StaticResource AccentBlue}" 
                                   Margin="0,0,10,0" VerticalAlignment="Center"/>
                        <TextBlock x:Name="WelcomeSubMessage" Grid.Column="1" 
                                   Text="Все ваши настройки были сохранены и перенесены." 
                                   Foreground="White" FontSize="12" FontWeight="SemiBold" 
                                   VerticalAlignment="Center" TextWrapping="Wrap"/>
                    </Grid>
                </Border>

                <Button Content="ПОЕХАЛИ!" Click="CloseWelcome_Click" Height="52" 
                        Background="{StaticResource AccentBlue}" Foreground="White" 
                        FontWeight="Black" FontSize="15" Cursor="Hand">
                    <Button.Template>
                        <ControlTemplate TargetType="Button">
                            <Border x:Name="BtnBorder" Background="{TemplateBinding Background}" CornerRadius="16">
                                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                            </Border>
                            <ControlTemplate.Triggers>
                                <Trigger Property="IsMouseOver" Value="True">
                                    <Setter TargetName="BtnBorder" Property="Background" Value="#4C85FF"/>
                                </Trigger>
                                <Trigger Property="IsPressed" Value="True">
                                    <Setter TargetName="BtnBorder" Property="Opacity" Value="0.85"/>
                                </Trigger>
                            </ControlTemplate.Triggers>
                        </ControlTemplate>
                    </Button.Template>
                </Button>
            </StackPanel>
        </Border>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsMainView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">
    <Grid>
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*"/>
            <ColumnDefinition Width="300"/>
        </Grid.ColumnDefinitions>

        <Border Grid.Column="0" Margin="0,0,20,0" CornerRadius="25" ClipToBounds="True">
            <Border.Background>
                <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
                    <GradientStop Color="#1A2026" Offset="0"/>
                    <GradientStop Color="#2D4356" Offset="1"/>
                </LinearGradientBrush>
            </Border.Background>

            <Border Padding="30">
                <Grid>
                    <Button HorizontalAlignment="Right" VerticalAlignment="Top" Cursor="Hand">
                        <Button.Template>
                            <ControlTemplate TargetType="Button">
                                <Border x:Name="bg" Background="#33000000" Width="36" Height="36" CornerRadius="18">
                                    <TextBlock Text="•••" Foreground="White" VerticalAlignment="Center" HorizontalAlignment="Center" Margin="0,0,0,2"/>
                                </Border>
                                <ControlTemplate.Triggers>
                                    <Trigger Property="IsMouseOver" Value="True">
                                        <Setter TargetName="bg" Property="Background" Value="#4D000000"/>
                                    </Trigger>
                                </ControlTemplate.Triggers>
                            </ControlTemplate>
                        </Button.Template>
                    </Button>

                    <StackPanel VerticalAlignment="Bottom">
                        <Grid Margin="0,0,0,20">
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="Auto"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>

                            <Border Width="60" Height="60" Background="#12131A" CornerRadius="15" BorderThickness="1" BorderBrush="#33FFFFFF">
                                <TextBlock Text="⌘" Foreground="White" FontSize="30" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                            </Border>

                            <StackPanel Grid.Column="1" Margin="15,0,0,0" VerticalAlignment="Center">
                                <TextBlock x:Name="BuildVersionTitle" Text="Версия" Foreground="White" FontSize="20" FontWeight="Bold"/>
                                <TextBlock Text="Оригинальный клиент игры" Foreground="White" Opacity="0.6" FontSize="14"/>
                            </StackPanel>
                        </Grid>

                        <Grid>
                            <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                <TextBlock Text="🕒" Foreground="White" Opacity="0.5" Margin="0,0,5,0"/>
                                <TextBlock Text="Нет данных" Foreground="White" Opacity="0.5" FontSize="12" Margin="0,0,20,0"/>
                                <TextBlock Text="⌘" Foreground="White" Opacity="0.5" Margin="0,0,5,0"/>
                                <TextBlock x:Name="BuildVersionSmall" Text="1.21.11" Foreground="White" Opacity="0.5" FontSize="12"/>
                            </StackPanel>

                            <Button HorizontalAlignment="Right" Width="140" Height="45" Cursor="Hand" Click="PlaySelectedBuild_Click">
                                <Button.Template>
                                    <ControlTemplate TargetType="Button">
                                        <Border x:Name="btn" Background="#007AFF" CornerRadius="12">
                                            <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                                                <TextBlock Text="▶" Foreground="White" VerticalAlignment="Center" Margin="0,0,8,0" FontSize="10"/>
                                                <TextBlock Text="Играть" Foreground="White" FontWeight="Bold" VerticalAlignment="Center" FontSize="14"/>
                                            </StackPanel>
                                        </Border>
                                        <ControlTemplate.Triggers>
                                            <Trigger Property="IsMouseOver" Value="True">
                                                <Setter TargetName="btn" Property="Background" Value="#1A87FF"/>
                                            </Trigger>
                                        </ControlTemplate.Triggers>
                                    </ControlTemplate>
                                </Button.Template>
                            </Button>
                        </Grid>
                    </StackPanel>
                </Grid>
            </Border>
        </Border>

        <StackPanel Grid.Column="1" Margin="10,0,0,0">
            <TextBlock Text="Дополнительно" Foreground="White" Opacity="0.6" FontWeight="Bold" FontSize="12" Margin="5,0,0,15"/>

            <Button Style="{StaticResource SidebarBuildButtonStyle}" Click="OpenBuildFolder_Click">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="📁" FontSize="14" Margin="0,0,12,0" Opacity="0.5" VerticalAlignment="Center"/>
                    <TextBlock Text="Открыть папку игры" VerticalAlignment="Center"/>
                </StackPanel>
            </Button>

            <Button Style="{StaticResource SidebarBuildButtonStyle}" Click="OpenClientFolder_Click">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="📂" FontSize="14" Margin="0,0,12,0" Opacity="0.5" VerticalAlignment="Center"/>
                    <TextBlock Text="Открыть папку клиента" VerticalAlignment="Center"/>
                </StackPanel>
            </Button>

            <TextBlock Text="Действия с профилем" Foreground="White" Opacity="0.6" FontWeight="Bold" FontSize="12" Margin="5,15,0,15"/>

            <Button Style="{StaticResource SidebarBuildButtonStyle}">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="▢" FontSize="14" Margin="0,0,12,0" Opacity="0.5" VerticalAlignment="Center"/>
                    <TextBlock Text="Дублировать" VerticalAlignment="Center"/>
                </StackPanel>
            </Button>

            <Button Style="{StaticResource SidebarBuildButtonStyle}">
                <StackPanel Orientation="Horizontal">
                    <TextBlock Text="🔧" FontSize="14" Margin="0,0,12,0" Opacity="0.5" VerticalAlignment="Center"/>
                    <TextBlock Text="Починить" VerticalAlignment="Center"/>
                </StackPanel>
            </Button>

            <Button Click="DeleteBuild_Click" Height="46" Margin="0,5,0,0">
                <Button.Template>
                    <ControlTemplate TargetType="Button">
                        <Border x:Name="bg" Background="#1AFF4444" CornerRadius="12">
                            <StackPanel Orientation="Horizontal" HorizontalAlignment="Left" Margin="15,0">
                                <TextBlock Text="🗑" Foreground="#FF4444" Margin="0,0,12,0" VerticalAlignment="Center"/>
                                <TextBlock Text="Удалить" Foreground="#FF4444" FontWeight="Bold" VerticalAlignment="Center"/>
                            </StackPanel>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="bg" Property="Background" Value="#26FF4444"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Button.Template>
            </Button>
        </StackPanel>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsModsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">
    <Border Background="#1C1E26" CornerRadius="16" Padding="30">
        <Grid>
                                    <Border Background="#1C1E26" CornerRadius="16" Padding="30">
                                        <Grid>
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="*"/>
                                                <ColumnDefinition Width="Auto" MinWidth="270" MaxWidth="320"/>
                                            </Grid.ColumnDefinitions>

                                            <Grid Grid.Column="0" Margin="0,0,40,0">
                                                <TextBlock Text="Установленные моды" Foreground="White" FontSize="20" FontWeight="SemiBold" VerticalAlignment="Top"/>

                                                <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                    <Grid HorizontalAlignment="Center" Margin="0,0,0,20" Opacity="0.4">
                                                        <TextBlock Text="🧩" FontSize="52" HorizontalAlignment="Center"/>
                                                        <TextBlock Text="✖" FontSize="20" Foreground="White" FontWeight="Bold" Margin="35,0,0,32" HorizontalAlignment="Right" VerticalAlignment="Top"/>
                                                    </Grid>

                                                    <TextBlock Text="Список модов пуст" Foreground="White" FontSize="16" FontWeight="SemiBold" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                                                    <TextBlock Text="Установите моды или перетащите файлы .jar справа" Foreground="#888888" FontSize="13" HorizontalAlignment="Center" TextAlignment="Center" TextWrapping="Wrap"/>
                                                </StackPanel>
                                            </Grid>

                                            <StackPanel Grid.Column="1">

                                                <TextBlock Text="Установка модов" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Grid Height="120" Margin="0,0,0,25" Cursor="Hand">
                                                    <Rectangle Stroke="#3A3D4A" StrokeThickness="1.5" StrokeDashArray="5,5" RadiusX="10" RadiusY="10"/>
                                                    <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                        <TextBlock Text="Перетащите .jar файл" Foreground="#AAAAAA" FontSize="13" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                                                        <TextBlock Text="или" Foreground="#666666" FontSize="11" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                                                        <Border Background="#23252E" CornerRadius="6" Padding="12,6">
                                                            <TextBlock Text="Выбрать файл" Foreground="White" FontSize="12" FontWeight="SemiBold"/>
                                                        </Border>
                                                    </StackPanel>
                                                </Grid>

                                                <TextBlock Text="Управление" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Button Margin="0,0,0,10" Background="#23252E" BorderThickness="0" Cursor="Hand">
                                                    <Button.Template>
                                                        <ControlTemplate TargetType="Button">
                                                            <Border Background="{TemplateBinding Background}" CornerRadius="8" Padding="15,12">
                                                                <StackPanel Orientation="Horizontal">
                                                                    <TextBlock Text="📂" Margin="0,0,12,0" VerticalAlignment="Center" Opacity="0.7"/>
                                                                    <TextBlock Text="Открыть папку mods" Foreground="#CCCCCC" FontSize="13" VerticalAlignment="Center"/>
                                                                </StackPanel>
                                                            </Border>
                                                            <ControlTemplate.Triggers>
                                                                <Trigger Property="IsMouseOver" Value="True">
                                                                    <Setter Property="Background" Value="#2A2D3A"/>
                                                                </Trigger>
                                                            </ControlTemplate.Triggers>
                                                        </ControlTemplate>
                                                    </Button.Template>
                                                </Button>

                                                <Button Background="#15161C" BorderThickness="1" BorderBrush="#2A2D3A" Cursor="Hand">
                                                    <Button.Template>
                                                        <ControlTemplate TargetType="Button">
                                                            <Border Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}" CornerRadius="8" Padding="15,12">
                                                                <StackPanel Orientation="Horizontal">
                                                                    <TextBlock Text="🌐" Margin="0,0,12,0" VerticalAlignment="Center" Opacity="0.7"/>
                                                                    <TextBlock Text="Найти моды в сети" Foreground="#888888" FontSize="13" VerticalAlignment="Center"/>
                                                                </StackPanel>
                                                            </Border>
                                                        </ControlTemplate>
                                                    </Button.Template>
                                                </Button>

                                                <Border Background="#2A1515" CornerRadius="8" Padding="15" Margin="0,25,0,0" BorderBrush="#3A1A1A" BorderThickness="1">
                                                    <StackPanel>
                                                        <TextBlock Text="⚠️ Внимание" Foreground="#FF5555" FontWeight="Bold" FontSize="12" Margin="0,0,0,5"/>
                                                        <TextBlock Text="Убедитесь, что версия мода совпадает с версией игры." Foreground="#CC8888" FontSize="11" TextWrapping="Wrap"/>
                                                    </StackPanel>
                                                </Border>

                                            </StackPanel>
                                        </Grid>
                                    </Border>
                                </Grid>
    </Border>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsParamsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="*"/>
                                        <ColumnDefinition Width="Auto" MinWidth="250" MaxWidth="300"/>
                                    </Grid.ColumnDefinitions>

                                    <ScrollViewer Grid.Column="0" VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled" Margin="0,0,20,0">
                                        <StackPanel Margin="0,0,5,20">

                                            <Border Background="#1C1E26" CornerRadius="16" Padding="25" Margin="0,0,0,15">
                                                <StackPanel>
                                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
                                                        <TextBlock Text="⚡" FontSize="16" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                        <TextBlock Text="Выделение памяти" Foreground="White" FontSize="16" FontWeight="Bold"/>
                                                    </StackPanel>
                                                    <TextBlock Text="Выделение оперативной памяти для клиента игры. Обычно клиенту достаточно 4 ГБ. Можно указать своё значение от 512 МБ." 
                               Foreground="#888888" FontSize="13" TextWrapping="Wrap" Margin="0,0,0,20"/>

                                                    <Grid>
                                                        <Grid.ColumnDefinitions>
                                                            <ColumnDefinition Width="Auto"/>
                                                            <ColumnDefinition Width="*"/>
                                                        </Grid.ColumnDefinitions>
                                                        <Border Background="#15161C" CornerRadius="8" Padding="15,8" BorderThickness="1" BorderBrush="#2A2D3A" MinWidth="90">
                                                            <TextBlock Text="1024 МБ" Foreground="White" VerticalAlignment="Center" HorizontalAlignment="Center"/>
                                                        </Border>
                                                        <Slider Grid.Column="1" Margin="20,0,0,0" Minimum="512" Maximum="6144" Value="1024" VerticalAlignment="Center"/>
                                                    </Grid>
                                                </StackPanel>
                                            </Border>

                                            <Border Background="#1C1E26" CornerRadius="16" Padding="25" Margin="0,0,0,15">
                                                <StackPanel>
                                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
                                                        <TextBlock Text="🖥" FontSize="16" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                        <TextBlock Text="Разрешение экрана игры" Foreground="White" FontSize="16" FontWeight="Bold"/>
                                                    </StackPanel>
                                                    <TextBlock Text="Размер окна запускаемой игры по умолчанию." Foreground="#888888" FontSize="13" TextWrapping="Wrap" Margin="0,0,0,20"/>

                                                    <WrapPanel Orientation="Horizontal">
                                                        <StackPanel Margin="0,0,15,15">
                                                            <Border Width="140" Height="90" Background="#23252E" CornerRadius="6" BorderThickness="1" BorderBrush="#2A2D3A" Padding="10">
                                                                <Border Background="#15161C" CornerRadius="4">
                                                                    <Border Background="#D00000" Width="20" Height="20" CornerRadius="4" VerticalAlignment="Center" HorizontalAlignment="Center">
                                                                        <TextBlock Text="C" Foreground="White" FontWeight="Bold" FontSize="12" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                                                                    </Border>
                                                                </Border>
                                                            </Border>
                                                            <RadioButton Content="Полноэкранный" Foreground="#AAAAAA" HorizontalAlignment="Center" Margin="0,8,0,0"/>
                                                        </StackPanel>

                                                        <StackPanel Margin="0,0,15,15">
                                                            <Border Width="140" Height="90" Background="#23252E" CornerRadius="6" BorderThickness="1" BorderBrush="#2A2D3A" Padding="10">
                                                                <Border Background="#15161C" CornerRadius="4">
                                                                    <StackPanel>
                                                                        <Border Height="8" Background="#2A2D3A" CornerRadius="4,4,0,0"/>
                                                                        <Border Background="#D00000" Width="20" Height="20" CornerRadius="4" Margin="0,15,0,0">
                                                                            <TextBlock Text="C" Foreground="White" FontWeight="Bold" FontSize="12" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                                                                        </Border>
                                                                    </StackPanel>
                                                                </Border>
                                                            </Border>
                                                            <RadioButton Content="Развёрнутый" Foreground="#AAAAAA" HorizontalAlignment="Center" Margin="0,8,0,0"/>
                                                        </StackPanel>

                                                        <StackPanel Margin="0,0,15,15">
                                                            <Border Width="140" Height="90" Background="#23252E" CornerRadius="6" BorderThickness="2" BorderBrush="#007AFF" Padding="25">
                                                                <Border Background="#15161C" CornerRadius="4">
                                                                    <StackPanel>
                                                                        <Border Height="8" Background="#2A2D3A" CornerRadius="4,4,0,0"/>
                                                                        <Border Background="#D00000" Width="20" Height="20" CornerRadius="4" Margin="0,5,0,0">
                                                                            <TextBlock Text="C" Foreground="White" FontWeight="Bold" FontSize="12" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                                                                        </Border>
                                                                    </StackPanel>
                                                                </Border>
                                                            </Border>
                                                            <RadioButton Content="Оконный" IsChecked="True" Foreground="White" HorizontalAlignment="Center" Margin="0,8,0,0"/>
                                                        </StackPanel>
                                                    </WrapPanel>
                                                </StackPanel>
                                            </Border>

                                            <Border Background="#1C1E26" CornerRadius="16" Padding="25" Margin="0,0,0,15">
                                                <StackPanel>
                                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
                                                        <TextBlock Text="📁" FontSize="16" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                        <TextBlock Text="Директория профиля" Foreground="White" FontSize="16" FontWeight="Bold"/>
                                                    </StackPanel>
                                                    <TextBlock Text="Папка для хранения файлов профиля (миры, моды, скриншоты). При смене директории клиент потеряет доступ к старым файлам!" 
                               Foreground="#888888" FontSize="13" TextWrapping="Wrap" Margin="0,0,0,15"/>

                                                    <Border Background="#15161C" BorderBrush="#2A2D3A" BorderThickness="1" CornerRadius="8" MinHeight="42">
                                                        <Grid>
                                                            <Grid.ColumnDefinitions>
                                                                <ColumnDefinition Width="*"/>
                                                                <ColumnDefinition Width="Auto"/>
                                                            </Grid.ColumnDefinitions>
                                                            <TextBox Grid.Column="0" Text="C:\Users\User\AppData\Roaming\.minecraft" Foreground="#888888" Background="Transparent" BorderThickness="0" VerticalContentAlignment="Center" Margin="10,0,0,0" IsReadOnly="True" TextWrapping="NoWrap"/>
                                                            <Button Grid.Column="1" Width="100" Background="#23252E" Foreground="#AAAAAA" BorderThickness="1,0,0,0" BorderBrush="#2A2D3A" Cursor="Hand">
                                                                <Button.Template>
                                                                    <ControlTemplate TargetType="Button">
                                                                        <Border Background="{TemplateBinding Background}" BorderThickness="{TemplateBinding BorderThickness}" BorderBrush="{TemplateBinding BorderBrush}" CornerRadius="0,8,8,0">
                                                                            <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" VerticalAlignment="Center">
                                                                                <TextBlock Text="📂" Margin="0,0,0,8"/>
                                                                                <TextBlock Text="Выбрать" Foreground="White"/>
                                                                            </StackPanel>
                                                                        </Border>
                                                                    </ControlTemplate>
                                                                </Button.Template>
                                                            </Button>
                                                        </Grid>
                                                    </Border>
                                                </StackPanel>
                                            </Border>

                                            <Border Background="#1C1E26" CornerRadius="16" Padding="25" Margin="0,0,0,15">
                                                <StackPanel>
                                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
                                                        <TextBlock Text="📄" FontSize="16" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                        <TextBlock Text="Журнал записей" Foreground="White" FontSize="16" FontWeight="Bold" Margin="0,0,15,0"/>
                                                        <Border Background="White" CornerRadius="12" Padding="8,2" VerticalAlignment="Center">
                                                            <TextBlock Text="Для разработчиков" Foreground="Black" FontWeight="Bold" FontSize="10"/>
                                                        </Border>
                                                    </StackPanel>
                                                    <TextBlock Text="Открывает окно журнала после запуска. Полезно для диагностики." 
                               Foreground="#888888" FontSize="13" TextWrapping="Wrap" Margin="0,0,0,20"/>
                                                    <CheckBox Content="Включить журнал" Style="{StaticResource ModernToggleSwitch}"/>
                                                </StackPanel>
                                            </Border>

                                            <Border Background="#1C1E26" CornerRadius="16" Padding="25" Margin="0,0,0,15">
                                                <StackPanel>
                                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
                                                        <TextBlock Text="🛡" FontSize="16" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                        <TextBlock Text="Проверка целостности" Foreground="White" FontSize="16" FontWeight="Bold" Margin="0,0,15,0"/>
                                                    </StackPanel>
                                                    <TextBlock Text="Проверка файлов перед запуском. Отключение может помочь со сторонними клиентами." 
                               Foreground="#888888" FontSize="13" TextWrapping="Wrap" Margin="0,0,0,15"/>
                                                    <Border Background="#2B2D3A" CornerRadius="8" Padding="15,12" Margin="0,0,0,20">
                                                        <TextBlock Text="Внимание: успешный запуск не гарантируется при отключении." Foreground="#AAAAAA" FontSize="13" TextWrapping="Wrap"/>
                                                    </Border>
                                                    <CheckBox Content="Проверка целостности" IsChecked="True" Style="{StaticResource ModernToggleSwitch}"/>
                                                </StackPanel>
                                            </Border>

                                            <Border Background="#1C1E26" CornerRadius="16" Padding="25" Margin="0,0,0,15">
                                                <StackPanel>
                                                    <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
                                                        <TextBlock Text="🔌" FontSize="16" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                        <TextBlock Text="Путь до Java" Foreground="White" FontSize="16" FontWeight="Bold"/>
                                                    </StackPanel>
                                                    <Border Background="#2A1515" CornerRadius="8" Padding="15,12" Margin="0,0,0,15">
                                                        <TextBlock Text="Осторожно: изменение может сломать запуск!" Foreground="#FF4444" FontWeight="SemiBold" FontSize="13" TextWrapping="Wrap"/>
                                                    </Border>
                                                    <Border Background="#15161C" BorderBrush="#2A2D3A" BorderThickness="1" CornerRadius="8" Height="42">
                                                        <Grid>
                                                            <Grid.ColumnDefinitions>
                                                                <ColumnDefinition Width="*"/>
                                                                <ColumnDefinition Width="Auto"/>
                                                            </Grid.ColumnDefinitions>
                                                            <TextBox Grid.Column="0" Text="Использовать стандартный путь" Foreground="#888888" Background="Transparent" BorderThickness="0" VerticalContentAlignment="Center" Margin="10,0,0,0" IsReadOnly="True"/>
                                                            <Button Grid.Column="1" Width="100" Background="#23252E" Content="Выбрать" Foreground="White" BorderThickness="1,0,0,0" BorderBrush="#2A2D3A"/>
                                                        </Grid>
                                                    </Border>
                                                </StackPanel>
                                            </Border>

                                        </StackPanel>
                                    </ScrollViewer>

                                    <StackPanel Grid.Column="1" Margin="10,0,0,0">
                                        <Border Background="#252733" CornerRadius="12" Padding="20" Margin="0,0,0,25">
                                            <StackPanel Orientation="Horizontal">
                                                <TextBlock Text="🏳️" Margin="0,0,15,0" Opacity="0.5"/>
                                                <TextBlock Text="Настройки только для этого клиента" Foreground="#AAAAAA" FontSize="13" TextWrapping="Wrap" MaxWidth="180"/>
                                            </StackPanel>
                                        </Border>

                                        <TextBlock Text="Действия" Foreground="White" FontWeight="Bold" FontSize="15" Margin="0,0,0,15"/>
                                        <Button Style="{StaticResource SidebarButtonStyle}" Content="Настройки лаунчера" Margin="0,0,0,8"/>
                                        <Button Style="{StaticResource SidebarButtonStyle}" Content="Сбросить всё"/>
                                    </StackPanel>
                                </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsResourcePacksView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">

             <Grid>
                                    <Border Background="#1C1E26" CornerRadius="16" Padding="30">
                                        <Grid>
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="*"/>
                                                <ColumnDefinition Width="Auto" MinWidth="260" MaxWidth="300"/>
                                            </Grid.ColumnDefinitions>

                                            <Grid Grid.Column="0" Margin="0,0,40,0">
                                                <TextBlock Text="Ресурспаки" Foreground="White" FontSize="20" FontWeight="SemiBold" VerticalAlignment="Top" HorizontalAlignment="Left"/>

                                                <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                    <Grid HorizontalAlignment="Center" Margin="0,0,0,20" Opacity="0.5">
                                                        <TextBlock Text="📦" FontSize="50" Foreground="#AAAAAA"/>
                                                        <TextBlock Text="✖" FontSize="24" Foreground="White" FontWeight="Bold" Margin="30,0,0,30" HorizontalAlignment="Right" VerticalAlignment="Top"/>
                                                    </Grid>

                                                    <TextBlock Text="Ресурспаки не найдены." Foreground="White" FontSize="16" FontWeight="SemiBold" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                                                    <TextBlock Text="Вы можете добавить их справа." Foreground="#888888" FontSize="14" HorizontalAlignment="Center"/>
                                                </StackPanel>
                                            </Grid>

                                            <StackPanel Grid.Column="1">

                                                <TextBlock Text="Добавление ресурспака" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Grid Height="110" Margin="0,0,0,30" Cursor="Hand" Background="Transparent">
                                                    <Rectangle Stroke="#4A4D5A" StrokeThickness="1" StrokeDashArray="6,4" RadiusX="8" RadiusY="8" Fill="Transparent"/>
                                                    <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                        <TextBlock Text="Перетащите ресурспак" Foreground="#AAAAAA" FontSize="13" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                                                        <TextBlock Text="или" Foreground="#666666" FontSize="12" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                                                        <StackPanel Orientation="Horizontal" HorizontalAlignment="Center">
                                                            <TextBlock Text="📁" Foreground="#AAAAAA" Margin="0,0,8,0" VerticalAlignment="Center"/>
                                                            <TextBlock Text="Выберите файл" Foreground="#AAAAAA" FontSize="13" FontWeight="SemiBold" VerticalAlignment="Center"/>
                                                        </StackPanel>
                                                    </StackPanel>
                                                </Grid>

                                                <TextBlock Text="Дополнительно" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Button Background="#23252E" BorderThickness="0" Cursor="Hand">
                                                    <Button.Template>
                                                        <ControlTemplate TargetType="Button">
                                                            <Border Background="{TemplateBinding Background}" CornerRadius="8" Padding="15,12">
                                                                <StackPanel Orientation="Horizontal" HorizontalAlignment="Left">
                                                                    <TextBlock Text="📁" Foreground="#AAAAAA" Margin="0,0,10,0" VerticalAlignment="Center"/>
                                                                    <TextBlock Text="Открыть папку" Foreground="#AAAAAA" FontSize="13" VerticalAlignment="Center"/>
                                                                </StackPanel>
                                                            </Border>
                                                            <ControlTemplate.Triggers>
                                                                <Trigger Property="IsMouseOver" Value="True">
                                                                    <Setter Property="Background" Value="#2A2D3A"/>
                                                                </Trigger>
                                                            </ControlTemplate.Triggers>
                                                        </ControlTemplate>
                                                    </Button.Template>
                                                </Button>

                                            </StackPanel>
                                        </Grid>
                                    </Border>
                                </Grid>

</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsScreenshotsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">

             <Grid>
                                    <Border Background="#1C1E26" CornerRadius="16" Padding="30">
                                        <Grid>
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="*"/>
                                                <ColumnDefinition Width="Auto" MinWidth="260" MaxWidth="320"/>
                                            </Grid.ColumnDefinitions>

                                            <Grid Grid.Column="0" Margin="0,0,40,0">
                                                <TextBlock Text="Ваши скриншоты" Foreground="White" FontSize="20" FontWeight="SemiBold" VerticalAlignment="Top"/>

                                                <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                    <TextBlock Text="📸" FontSize="52" HorizontalAlignment="Center" Opacity="0.4" Margin="0,0,0,20"/>
                                                    <TextBlock Text="Скриншотов пока нет" Foreground="White" FontSize="16" FontWeight="SemiBold" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                                                    <TextBlock Text="Нажмите F2 во время игры, чтобы сделать снимок экрана" Foreground="#888888" FontSize="13" HorizontalAlignment="Center" TextAlignment="Center" TextWrapping="Wrap"/>
                                                </StackPanel>
                                            </Grid>

                                            <StackPanel Grid.Column="1">
                                                <TextBlock Text="Управление" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Button Background="#23252E" BorderThickness="0" Cursor="Hand">
                                                    <Button.Template>
                                                        <ControlTemplate TargetType="Button">
                                                            <Border Background="{TemplateBinding Background}" CornerRadius="8" Padding="15,12">
                                                                <StackPanel Orientation="Horizontal">
                                                                    <TextBlock Text="🖼" Margin="0,0,12,0" VerticalAlignment="Center" Opacity="0.7"/>
                                                                    <TextBlock Text="Открыть папку снимков" Foreground="#CCCCCC" FontSize="13" VerticalAlignment="Center"/>
                                                                </StackPanel>
                                                            </Border>
                                                        </ControlTemplate>
                                                    </Button.Template>
                                                </Button>

                                                <Border Background="#252733" CornerRadius="8" Padding="15" Margin="0,20,0,0">
                                                    <TextBlock Text="Скриншоты сохраняются в формате .png и доступны для просмотра в любое время." Foreground="#888888" FontSize="11" TextWrapping="Wrap"/>
                                                </Border>
                                            </StackPanel>
                                        </Grid>
                                    </Border>
                                </Grid>

</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsView"    
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"    
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"    
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"     
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008"     
             mc:Ignorable="d" d:DesignWidth="1050" d:DesignHeight="700">

    <Grid MaxWidth="1050" HorizontalAlignment="Stretch" Margin="0,70,0,80">    
        <Grid.RowDefinitions>    
            <RowDefinition Height="Auto"/>    
            <RowDefinition Height="*"/>    
        </Grid.RowDefinitions>    

        <Grid Grid.Row="0" Margin="0,0,0,35">    
            <Grid.ColumnDefinitions>    
                <ColumnDefinition Width="Auto"/>    
                <ColumnDefinition Width="*"/>    
            </Grid.ColumnDefinitions>    

            <Button Click="BackToMain_Click" VerticalAlignment="Bottom" Margin="0,0,25,0" Cursor="Hand">    
                <Button.Template>    
                    <ControlTemplate TargetType="Button">    
                        <Border x:Name="backBtn" Background="#12131A" Width="42" Height="42" CornerRadius="12" BorderThickness="1" BorderBrush="#1F2026">    
                            <TextBlock Text="←" Foreground="White" FontSize="18" VerticalAlignment="Center" HorizontalAlignment="Center" Margin="0,0,0,2"/>    
                        </Border>    
                        <ControlTemplate.Triggers>    
                            <Trigger Property="IsMouseOver" Value="True">    
                                <Setter TargetName="backBtn" Property="BorderBrush" Value="{StaticResource AccentBlue}"/>    
                                <Setter TargetName="backBtn" Property="Background" Value="#1A1B26"/>    
                            </Trigger>    
                        </ControlTemplate.Triggers>    
                    </ControlTemplate>    
                </Button.Template>    
            </Button>    

            <StackPanel Grid.Column="1" Orientation="Horizontal" VerticalAlignment="Bottom" Height="42">    
                <RadioButton Content="ГЛАВНАЯ" Style="{StaticResource TabButtonStyle}" Tag="Main" Checked="Tab_Checked" IsChecked="True"/>    
                <RadioButton Content="НАСТРОЙКИ" Style="{StaticResource TabButtonStyle}" Tag="Settings" Checked="Tab_Checked"/>    
                <RadioButton Content="МОДЫ" Style="{StaticResource TabButtonStyle}" Tag="Mods" Checked="Tab_Checked"/>    
                <RadioButton Content="РЕСУРСПАКИ" Style="{StaticResource TabButtonStyle}" Tag="ResourcePacks" Checked="Tab_Checked"/>    
                <RadioButton Content="МИРЫ" Style="{StaticResource TabButtonStyle}" Tag="Worlds" Checked="Tab_Checked"/>    
                <RadioButton Content="СКРИНШОТЫ" Style="{StaticResource TabButtonStyle}" Tag="Scrin" Checked="Tab_Checked"/>    
            </StackPanel>    
        </Grid>    

        <ContentControl x:Name="TabContent" Grid.Row="1" />
    </Grid>  
</UserControl>
using System.Windows;
using System.Windows.Controls;
// Если эти View лежат в другой папке, добавь нужный using, например:
// using SubReelLauncher.Presentation.Views.Pages; 

namespace SubReelLauncher.Presentation.Views.Pages
{
    public partial class BuildSettingsView : UserControl
    {

        private void BackToMain_Click(object sender, RoutedEventArgs e)
        {
            // Здесь должна быть логика возврата к списку всех сборок
            // Если используешь ViewModel:
            // ((MainViewModel)Application.Current.MainWindow.DataContext).CurrentPage = new BuildsView();
        }

        private void Tab_Checked(object sender, RoutedEventArgs e)
        {
            // Проверка, что компонент уже создан (чтобы не было вылета при старте)
            if (TabContent == null) return;

            var tag = (sender as RadioButton)?.Tag?.ToString();

            switch (tag)
            {
                case "Main":
                    TabContent.Content = new BuildSettingsMainView();
                    break;
                case "Settings":
                    TabContent.Content = new BuildSettingsParamsView();
                    break;
                case "Mods":
                    TabContent.Content = new BuildSettingsModsView();
                    break;
                case "ResourcePacks":
                    TabContent.Content = new BuildSettingsResourcePacksView();
                    break;
                case "Worlds":
                    TabContent.Content = new BuildSettingsWorldsView();
                    break;
                case "Scrin":
                    TabContent.Content = new BuildSettingsScreenshotsView();
                    break;
            }
        }
    }
}
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildSettingsWorldsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">

             <Grid>
                                    <Border Background="#1C1E26" CornerRadius="16" Padding="30">
                                        <Grid>
                                            <Grid.ColumnDefinitions>
                                                <ColumnDefinition Width="*"/>
                                                <ColumnDefinition Width="Auto" MinWidth="260" MaxWidth="320"/>
                                            </Grid.ColumnDefinitions>

                                            <Grid Grid.Column="0" Margin="0,0,40,0">
                                                <TextBlock Text="Ваши миры" Foreground="White" FontSize="20" FontWeight="SemiBold" VerticalAlignment="Top"/>

                                                <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                    <Grid HorizontalAlignment="Center" Margin="0,0,0,20" Opacity="0.4">
                                                        <TextBlock Text="🌍" FontSize="52" HorizontalAlignment="Center"/>
                                                        <TextBlock Text="✖" FontSize="20" Foreground="White" FontWeight="Bold" Margin="35,0,0,32" HorizontalAlignment="Right" VerticalAlignment="Top"/>
                                                    </Grid>

                                                    <TextBlock Text="Миры не найдены" Foreground="White" FontSize="16" FontWeight="SemiBold" HorizontalAlignment="Center" Margin="0,0,0,10"/>
                                                    <TextBlock Text="Перенесите папку с миром в область справа или создайте новый мир в игре" 
                               Foreground="#888888" FontSize="13" HorizontalAlignment="Center" TextAlignment="Center" TextWrapping="Wrap"/>
                                                </StackPanel>
                                            </Grid>

                                            <StackPanel Grid.Column="1">

                                                <TextBlock Text="Импорт мира" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Grid Height="120" Margin="0,0,0,25" Cursor="Hand">
                                                    <Rectangle Stroke="#3A3D4A" StrokeThickness="1.5" StrokeDashArray="5,5" RadiusX="10" RadiusY="10"/>
                                                    <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                        <TextBlock Text="Перетащите папку мира" Foreground="#AAAAAA" FontSize="13" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                                                        <TextBlock Text="или" Foreground="#666666" FontSize="11" HorizontalAlignment="Center" Margin="0,0,0,8"/>
                                                        <Border Background="#23252E" CornerRadius="6" Padding="12,6">
                                                            <TextBlock Text="Выбрать архив/папку" Foreground="White" FontSize="12" FontWeight="SemiBold"/>
                                                        </Border>
                                                    </StackPanel>
                                                </Grid>

                                                <TextBlock Text="Управление данными" Foreground="White" FontSize="14" FontWeight="SemiBold" Margin="0,0,0,15"/>

                                                <Button Margin="0,0,0,10" Background="#23252E" BorderThickness="0" Cursor="Hand">
                                                    <Button.Template>
                                                        <ControlTemplate TargetType="Button">
                                                            <Border Background="{TemplateBinding Background}" CornerRadius="8" Padding="15,12">
                                                                <StackPanel Orientation="Horizontal">
                                                                    <TextBlock Text="📂" Margin="0,0,12,0" VerticalAlignment="Center" Opacity="0.7"/>
                                                                    <TextBlock Text="Открыть папку saves" Foreground="#CCCCCC" FontSize="13" VerticalAlignment="Center"/>
                                                                </StackPanel>
                                                            </Border>
                                                            <ControlTemplate.Triggers>
                                                                <Trigger Property="IsMouseOver" Value="True">
                                                                    <Setter Property="Background" Value="#2A2D3A"/>
                                                                </Trigger>
                                                            </ControlTemplate.Triggers>
                                                        </ControlTemplate>
                                                    </Button.Template>
                                                </Button>

                                                <Button Margin="0,0,0,10" Background="#15161C" BorderThickness="1" BorderBrush="#2A2D3A" Cursor="Hand">
                                                    <Button.Template>
                                                        <ControlTemplate TargetType="Button">
                                                            <Border Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}" CornerRadius="8" Padding="15,12">
                                                                <StackPanel Orientation="Horizontal">
                                                                    <TextBlock Text="📦" Margin="0,0,12,0" VerticalAlignment="Center" Opacity="0.7"/>
                                                                    <TextBlock Text="Бэкапы (Backups)" Foreground="#888888" FontSize="13" VerticalAlignment="Center"/>
                                                                </StackPanel>
                                                            </Border>
                                                        </ControlTemplate>
                                                    </Button.Template>
                                                </Button>

                                                <Border Background="#15202A" CornerRadius="8" Padding="15" Margin="0,20,0,0" BorderBrush="#1E2D3E" BorderThickness="1">
                                                    <Grid>
                                                        <Grid.ColumnDefinitions>
                                                            <ColumnDefinition Width="Auto"/>
                                                            <ColumnDefinition Width="*"/>
                                                        </Grid.ColumnDefinitions>
                                                        <TextBlock Text="ℹ️" Margin="0,0,10,0" VerticalAlignment="Top"/>
                                                        <TextBlock Grid.Column="1" Text="Совет: делайте резервные копии миров перед установкой новых тяжелых модов." 
                                   Foreground="#8899AA" FontSize="11" TextWrapping="Wrap"/>
                                                    </Grid>
                                                </Border>

                                            </StackPanel>
                                        </Grid>
                                    </Border>
                                </Grid>

</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.BuildsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="600" d:DesignWidth="800">

    <UserControl.Resources>
        <Style x:Key="BigCardButton" TargetType="Button">
            <Setter Property="Height" Value="160"/>
            <Setter Property="Margin" Value="10,0,10,0"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Grid Background="Transparent" Cursor="Hand">
                            <Border x:Name="Shadow" Background="{StaticResource AccentBlue}" Opacity="0" CornerRadius="22" Margin="2">
                                <Border.Effect>
                                    <BlurEffect Radius="20"/>
                                </Border.Effect>
                            </Border>
                            <Border x:Name="Card" Background="{StaticResource CardBg}" CornerRadius="22" BorderThickness="2" BorderBrush="{StaticResource BorderSharp}" Margin="5">
                                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                            </Border>
                        </Grid>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="Card" Property="Background" Value="#181921"/>
                                <Setter TargetName="Card" Property="BorderBrush" Value="{StaticResource AccentBlue}"/>
                                <Setter TargetName="Shadow" Property="Opacity" Value="0.2"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
    </UserControl.Resources>

    <Grid Margin="15,0,15,15">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/> <RowDefinition Height="*"/>    </Grid.RowDefinitions>

        <StackPanel Grid.Row="0" Margin="10,10,0,25">
            <StackPanel Orientation="Horizontal">
                <TextBlock Text="SubReel Studio" Foreground="White" FontSize="24" FontWeight="Black" Opacity="0.9"/>
                
                <StackPanel x:Name="AdditionalHeaderPart" Orientation="Horizontal" Visibility="Collapsed" VerticalAlignment="Bottom" Margin="0,0,0,4">
                    <TextBlock Text="/" Foreground="White" FontSize="14" Opacity="0.2" Margin="12,0" FontWeight="Bold"/>
                    <TextBlock x:Name="AdditionalHeaderText" Text="Создание" Foreground="White" FontSize="15" FontWeight="SemiBold" Opacity="0.5"/>
                </StackPanel>

                <StackPanel x:Name="BreadcrumbsText" Orientation="Horizontal" Visibility="Collapsed" VerticalAlignment="Bottom" Margin="0,0,0,4">
                    <TextBlock Text="/" Foreground="White" FontSize="14" Opacity="0.2" Margin="12,0" FontWeight="Bold"/>
                    <TextBlock x:Name="SubHeaderText" Text="Своя сборка" Foreground="{StaticResource AccentBlue}" FontSize="15" FontWeight="Bold">
                        <TextBlock.Effect>
                            <DropShadowEffect Color="#78C8FF" BlurRadius="12" Opacity="0.4" ShadowDepth="0"/>
                        </TextBlock.Effect>
                    </TextBlock>
                </StackPanel>
            </StackPanel>
        </StackPanel>

        <ScrollViewer Grid.Row="1" VerticalScrollBarVisibility="Auto" HorizontalScrollBarVisibility="Disabled">
            <StackPanel x:Name="BuildsPanel">

                <Border Background="#0B0C12" CornerRadius="12" BorderThickness="1" BorderBrush="#2A2D3A" Margin="10,0,10,20" Height="45">
                    <Grid>
                        <TextBlock Text="🔍" Foreground="{StaticResource TextGray}" FontSize="14" VerticalAlignment="Center" Margin="15,0,0,0"/>
                        <TextBox x:Name="SearchBuildsBox" Background="Transparent" BorderThickness="0" Foreground="White" FontSize="14" 
                                 VerticalContentAlignment="Center" Margin="40,0,15,0" CaretBrush="{StaticResource AccentBlue}" 
                                 TextChanged="SearchBuildsBox_TextChanged"/>
                        
                        <TextBlock Text="Поиск сборок..." Foreground="#555" VerticalAlignment="Center" Margin="40,0,15,0" 
                                   IsHitTestVisible="False" FontSize="14">
                            <TextBlock.Style>
                                <Style TargetType="TextBlock">
                                    <Setter Property="Visibility" Value="Collapsed"/>
                                    <Style.Triggers>
                                        <DataTrigger Binding="{Binding Text, ElementName=SearchBuildsBox}" Value="">
                                            <Setter Property="Visibility" Value="Visible"/>
                                        </DataTrigger>
                                    </Style.Triggers>
                                </Style>
                            </TextBlock.Style>
                        </TextBlock>
                    </Grid>
                </Border>

                <UniformGrid Columns="2" Margin="0,0,0,20">
                    <Button Click="CreateBtnServer_Click" Style="{StaticResource BigCardButton}">
                        <StackPanel>
                            <TextBlock Text="Наш сервер" Foreground="White" FontWeight="Bold" FontSize="14" HorizontalAlignment="Center"/>
                            <TextBlock Text="Наши моды и настройки" Foreground="#666" FontSize="10" Margin="0,5,0,0" HorizontalAlignment="Center"/>
                        </StackPanel>
                    </Button>

                    <Button Click="CreateCustomVersion_Click" Style="{StaticResource BigCardButton}">
                        <StackPanel>
                            <TextBlock Text="+" Foreground="{StaticResource AccentBlue}" FontSize="48" FontWeight="Light" HorizontalAlignment="Center" Margin="0,0,0,-5"/>
                            <TextBlock Text="СОЗДАТЬ СБОРКУ" Foreground="White" FontWeight="Bold" FontSize="14" HorizontalAlignment="Center"/>
                            <TextBlock Text="Свои моды и настройки" Foreground="#666" FontSize="10" Margin="0,5,0,0" HorizontalAlignment="Center"/>
                        </StackPanel>
                    </Button>
                </UniformGrid>

                <StackPanel Margin="10,0,10,20">
                    <TextBlock Text="ВАШИ СБОРКИ" Foreground="#888" FontSize="12" FontWeight="Black" Margin="5,0,0,10"/>
                    
                    <ItemsControl x:Name="CustomBuildsContainer">
                        <ItemsControl.ItemsPanel>
                            <ItemsPanelTemplate>
                                <UniformGrid Columns="2"/>
                            </ItemsPanelTemplate>
                        </ItemsControl.ItemsPanel>

                        <ItemsControl.ItemTemplate>
                            <DataTemplate>
                                <Button Height="160" Margin="10,0,10,20" Click="SelectBuild_Click">
                                    <Button.Template>
                                        <ControlTemplate TargetType="Button">
                                            <Grid Background="Transparent" Cursor="Hand">
                                                <Border x:Name="Shadow" Background="{StaticResource AccentBlue}" Opacity="0" CornerRadius="22" Margin="2">
                                                    <Border.Effect><BlurEffect Radius="20"/></Border.Effect>
                                                </Border>

                                                <Border x:Name="Card" Background="{StaticResource CardBg}" CornerRadius="22" BorderThickness="2" BorderBrush="{StaticResource BorderSharp}" Margin="5">
                                                    <Grid>
                                                        <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                                            <TextBlock Text="{Binding Name}" Foreground="White" FontWeight="Bold" FontSize="14" HorizontalAlignment="Center"/>
                                                            <TextBlock Foreground="#666" FontSize="10" Margin="0,5,0,0" HorizontalAlignment="Center">
                                                                <TextBlock.Text>
                                                                    <MultiBinding StringFormat="{}{0} {1}">
                                                                        <Binding Path="Loader"/>
                                                                        <Binding Path="Version"/>
                                                                    </MultiBinding>
                                                                </TextBlock.Text>
                                                            </TextBlock>
                                                        </StackPanel>

                                                        <Button HorizontalAlignment="Right" VerticalAlignment="Top" Margin="15" Width="30" Height="30" Click="ToggleFavorite_Click" Style="{StaticResource {x:Static ToolBar.ButtonStyleKey}}">
                                                            <TextBlock Text="{Binding IsFavorite, Converter={StaticResource StarConverter}}" 
                                                                       Foreground="{Binding IsFavorite, Converter={StaticResource StarColorConverter}}" 
                                                                       FontSize="22" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                                                        </Button>

                                                        <Button HorizontalAlignment="Right" VerticalAlignment="Bottom" Margin="12" Width="35" Height="35" Click="OpenBuildSettings_Click" Style="{StaticResource {x:Static ToolBar.ButtonStyleKey}}">
                                                            <TextBlock Text="⚙" FontSize="20" Foreground="#666"/>
                                                        </Button>
                                                    </Grid>
                                                </Border>
                                            </Grid>
                                            <ControlTemplate.Triggers>
                                                <Trigger Property="IsMouseOver" Value="True">
                                                    <Setter TargetName="Card" Property="Background" Value="#181921"/><Setter TargetName="Card" Property="BorderBrush" Value="{StaticResource AccentBlue}"/><Setter TargetName="Shadow" Property="Opacity" Value="0.2"/>
                                                </Trigger>
                                            </ControlTemplate.Triggers>
                                        </ControlTemplate>
                                    </Button.Template>
                                </Button>
                            </DataTemplate>
                        </ItemsControl.ItemTemplate>
                    </ItemsControl>
                </StackPanel>
            </StackPanel>
        </ScrollViewer>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.CommunityView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="555" d:DesignWidth="880">

    <Grid CacheMode="BitmapCache">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="220"/>
            <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <Border Background="#0C0D12" CornerRadius="18" BorderThickness="1" 
                BorderBrush="{StaticResource BorderSharp}" Margin="0,0,15,0">
            <Grid Margin="15">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                </Grid.RowDefinitions>

                <StackPanel Orientation="Horizontal" Margin="5,0,0,12">
                    <TextBlock Text="ДРУЗЬЯ В СЕТИ" Foreground="{StaticResource AccentBlue}" 
                               FontSize="10" FontWeight="Black" VerticalAlignment="Center"/>
                </StackPanel>

                <ScrollViewer Grid.Row="1" VerticalScrollBarVisibility="Auto">
                    <ItemsControl x:Name="FriendsListControl" ItemsSource="{Binding Friends}">
                        <ItemsControl.ItemTemplate>
                            <DataTemplate>
                                <Border Background="{StaticResource CardBg}" CornerRadius="10" Padding="8" Margin="0,0,0,6">
                                    <StackPanel Orientation="Horizontal">
                                        <Ellipse Width="10" Height="10" Fill="#20F289" Margin="5,0,10,0"/>
                                        <TextBlock Text="{Binding Nickname}" Foreground="White" FontSize="12" VerticalAlignment="Center"/>
                                    </StackPanel>
                                </Border>
                            </DataTemplate>
                        </ItemsControl.ItemTemplate>
                    </ItemsControl>
                </ScrollViewer>
            </Grid>
        </Border>

        <Border Grid.Column="1" Background="#0C0D12" CornerRadius="18" BorderThickness="1" 
                BorderBrush="{StaticResource BorderSharp}">
            <Grid Margin="15">
                <Grid.RowDefinitions>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>

                <ScrollViewer x:Name="ChatScroll" Margin="0,0,0,10">
                    <ItemsControl x:Name="ChatMessages" ItemsSource="{Binding Messages}">
                        <ItemsControl.ItemTemplate>
                            <DataTemplate>
                                <StackPanel Margin="0,4">
                                    <TextBlock Text="{Binding Nickname}" Foreground="{StaticResource AccentBlue}" 
                                               FontSize="11" FontWeight="Bold"/>
                                    <TextBlock Text="{Binding Message}" Foreground="White" 
                                               FontSize="13" TextWrapping="Wrap"/>
                                </StackPanel>
                            </DataTemplate>
                        </ItemsControl.ItemTemplate>
                    </ItemsControl>
                </ScrollViewer>

                <Border Grid.Row="1" Background="{StaticResource BgDark}" CornerRadius="12" 
                        BorderThickness="1" BorderBrush="{StaticResource BorderSharp}" Padding="5">
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="Auto"/>
                        </Grid.ColumnDefinitions>

                        <TextBox x:Name="ChatMessageInput" Background="Transparent" BorderThickness="0" 
                                 Foreground="White" Padding="10,6" VerticalContentAlignment="Center" 
                                 KeyDown="ChatMessageInput_KeyDown" CaretBrush="{StaticResource AccentBlue}"
                                 Tag="Введите сообщение..."/>

                        <Button Grid.Column="1" Content="➔" Foreground="{StaticResource AccentBlue}" 
                                Background="Transparent" BorderThickness="0" FontWeight="Bold" 
                                FontSize="18" Width="45" Click="SendMessage_Click" Cursor="Hand"/>
                    </Grid>
                </Border>
            </Grid>
        </Border>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.CreateBuildDetailsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <Grid Grid.Row="0" Margin="0,0,0,35">
            <StackPanel VerticalAlignment="Center">
                <TextBlock Text="НАСТРОЙКА НОВОЙ СБОРКИ" Foreground="White" FontSize="20" FontWeight="Black" Opacity="0.9"/>
                <Border Height="3" Width="40" Background="{StaticResource AccentBlue}" HorizontalAlignment="Left" Margin="0,8,0,0" CornerRadius="1.5">
                    <Border.Effect><DropShadowEffect Color="#4C85FF" BlurRadius="8" Opacity="0.5" ShadowDepth="0"/></Border.Effect>
                </Border>
            </StackPanel>
        </Grid>

        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="550"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <Grid>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="*"/>
                </Grid.RowDefinitions>

                <Button Grid.Row="0" HorizontalAlignment="Left" Click="BackToSelection_Click" Cursor="Hand" Margin="0,0,0,20">
                    <Button.Template>
                        <ControlTemplate TargetType="Button">
                            <Border x:Name="btn" Background="Transparent" Padding="0,8" BorderThickness="0,0,0,1" BorderBrush="#1AFFFFFF">
                                <StackPanel Orientation="Horizontal">
                                    <TextBlock x:Name="ArrowTxt" Text="BACK" Foreground="{StaticResource TextGray}" FontWeight="Black" FontSize="9" Margin="0,0,15,0"/>
                                    <TextBlock x:Name="BackTxt" Text="ВЕРНУТЬСЯ К ВЫБОРУ" Foreground="#888" FontSize="10" FontWeight="Bold"/>
                                </StackPanel>
                            </Border>
                            <ControlTemplate.Triggers>
                                <Trigger Property="IsMouseOver" Value="True">
                                    <Setter TargetName="btn" Property="BorderBrush" Value="{StaticResource AccentBlue}"/>
                                    <Setter TargetName="ArrowTxt" Property="Foreground" Value="{StaticResource AccentBlue}"/>
                                    <Setter TargetName="BackTxt" Property="Foreground" Value="White"/>
                                </Trigger>
                            </ControlTemplate.Triggers>
                        </ControlTemplate>
                    </Button.Template>
                </Button>

                <Border Grid.Row="1" Margin="0,0,30,20" Background="#12131A" CornerRadius="18" Padding="25" BorderThickness="1" BorderBrush="#1F2026">
                    <StackPanel>
                        <StackPanel Orientation="Horizontal" Margin="0,0,0,25">
                            <TextBlock Text="[ BUILD ]" Foreground="{StaticResource AccentBlue}" FontWeight="Black" FontSize="10" Margin="0,0,15,0" Opacity="0.5"/>
                            <TextBlock Text="ОСНОВНЫЕ ПАРАМЕТРЫ" Foreground="White" FontWeight="Bold" FontSize="12"/>
                        </StackPanel>

                        <StackPanel Margin="0,0,0,20">
                            <TextBlock Text="НАЗВАНИЕ ПРОФИЛЯ" Foreground="#888" FontSize="10" FontWeight="Bold" Margin="5,0,0,8"/>
                            <Border Background="#0B0C12" CornerRadius="10" Padding="15,5" BorderThickness="1" BorderBrush="#2A2D3A" Height="45">
                                <TextBox x:Name="BuildNameInput" Text="My New Pack" Style="{StaticResource ModernTextBoxStyle}" Background="Transparent" Foreground="White" BorderThickness="0" FontSize="15" FontWeight="Bold" CaretBrush="{StaticResource AccentBlue}" VerticalContentAlignment="Center"/>
                            </Border>
                        </StackPanel>

                        <Grid>
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="*"/>
                                <ColumnDefinition Width="20"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>
                            <StackPanel Grid.Column="0">
                                <TextBlock Text="ВЕРСИЯ ИГРЫ" Foreground="#888" FontSize="10" FontWeight="Bold" Margin="5,0,0,8"/>
                                <Border Background="#0B0C12" CornerRadius="10" BorderThickness="1" BorderBrush="#2A2D3A" Height="45">
                                    <ComboBox x:Name="VersionSelector" Style="{StaticResource ModernComboBoxStyle}">
                                        <ComboBoxItem Content="1.21.1" IsSelected="True"/>
                                        <ComboBoxItem Content="1.20.1"/>
                                    </ComboBox>
                                </Border>
                            </StackPanel>
                            <StackPanel Grid.Column="2">
                                <TextBlock Text="МОДИФИКАЦИЯ" Foreground="#888" FontSize="10" FontWeight="Bold" Margin="5,0,0,8"/>
                                <Border Background="#0B0C12" CornerRadius="10" BorderThickness="1" BorderBrush="#2A2D3A" Height="45">
                                    <ComboBox x:Name="LoaderSelector" Style="{StaticResource ModernComboBoxStyle}">
                                        <ComboBoxItem Content="Fabric" IsSelected="True"/>
                                        <ComboBoxItem Content="Forge"/>
                                        <ComboBoxItem Content="NeoForge"/>
                                        <ComboBoxItem Content="Quilt"/>
                                    </ComboBox>
                                </Border>
                            </StackPanel>
                        </Grid>
                    </StackPanel>
                </Border>
            </Grid>

            <Grid Grid.Column="1">
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>
                <Border Grid.Row="0" Background="#0A0B10" CornerRadius="18" Padding="25" BorderThickness="1" BorderBrush="#1A1B23" Margin="0,0,0,20">
                    <Grid>
                        <Grid.RowDefinitions>
                            <RowDefinition Height="Auto"/>
                            <RowDefinition Height="Auto"/>
                        </Grid.RowDefinitions>
                        <Border Grid.Row="0" Width="54" Height="54" Background="#12131A" BorderThickness="1" BorderBrush="#1F2026" CornerRadius="14" HorizontalAlignment="Left" Margin="0,0,0,25">
                            <TextBlock Text="🛠" FontSize="24" HorizontalAlignment="Center" VerticalAlignment="Center" Foreground="{StaticResource AccentBlue}"/>
                        </Border>
                        <StackPanel Grid.Row="1">
                            <TextBlock Text="{Binding Text, ElementName=BuildNameInput}" Foreground="White" FontSize="22" FontWeight="Black" TextTrimming="CharacterEllipsis" Margin="0,0,0,6"/>
                            <TextBlock Text="Режим: Своя сборка" Foreground="{StaticResource AccentBlue}" FontSize="11" FontWeight="Bold" Opacity="0.8"/>
                        </StackPanel>
                    </Grid>
                </Border>
                <Button Grid.Row="1" Content="СОЗДАТЬ СБОРКУ" Height="55" Style="{StaticResource AnimatedAccentPlayButtonStyle}" FontSize="14" FontWeight="Black" Margin="0,27,0,-27">
                    <Button.Effect><DropShadowEffect Color="#4C85FF" BlurRadius="15" Opacity="0.25" ShadowDepth="0"/></Button.Effect>
                </Button>
            </Grid>
        </Grid>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.CreateBuildSelectionView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" d:DesignWidth="1050">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <Grid Grid.Row="0" Margin="0,0,0,35">
            <StackPanel VerticalAlignment="Center">
                <TextBlock Text="ВЫБЕРИТЕ СПОСОБ СОЗДАНИЯ" Foreground="White" FontSize="20" FontWeight="Black" Opacity="0.9"/>
                <Border Height="3" Width="40" Background="{StaticResource AccentBlue}" HorizontalAlignment="Left" Margin="0,8,0,0" CornerRadius="1.5">
                    <Border.Effect>
                        <DropShadowEffect Color="#4C85FF" BlurRadius="8" Opacity="0.5" ShadowDepth="0"/>
                    </Border.Effect>
                </Border>
            </StackPanel>
        </Grid>

        <Grid Grid.Row="1" HorizontalAlignment="Stretch">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            <Grid.RowDefinitions>
                <RowDefinition Height="160"/>
                <RowDefinition Height="20"/>
                <RowDefinition Height="140"/>
            </Grid.RowDefinitions>

            <Button Click="SelectCustom_Click" Tag="Custom" Grid.Row="0" Grid.Column="0" Grid.ColumnSpan="2" Margin="0,0,10,0" Cursor="Hand">
                <Button.Template>
                    <ControlTemplate TargetType="Button">
                        <Grid Background="Transparent">
                            <Border x:Name="Shadow" Background="{StaticResource AccentBlue}" Opacity="0" CornerRadius="22" Margin="2">
                                <Border.Effect><BlurEffect Radius="20"/></Border.Effect>
                            </Border>
                            <Border x:Name="Card" Background="{StaticResource CardBg}" CornerRadius="22" BorderBrush="{StaticResource BorderSharp}" BorderThickness="2" Padding="30" Margin="2" CacheMode="BitmapCache">
                                <Border.RenderTransform><TranslateTransform Y="0"/></Border.RenderTransform>
                                <Grid>
                                    <Grid.ColumnDefinitions>
                                        <ColumnDefinition Width="Auto"/>
                                        <ColumnDefinition Width="*"/>
                                    </Grid.ColumnDefinitions>
                                    <Border Width="70" Height="70" Background="#0A0A0E" BorderThickness="1" BorderBrush="{StaticResource BorderSharp}" CornerRadius="16" VerticalAlignment="Center" Margin="0,0,25,0">
                                        <TextBlock Text="🛠" FontSize="28" VerticalAlignment="Center" HorizontalAlignment="Center"/>
                                    </Border>
                                    <StackPanel Grid.Column="1" VerticalAlignment="Center">
                                        <TextBlock Text="Своя сборка" Foreground="White" FontSize="22" FontWeight="Black" Margin="0,0,0,8"/>
                                        <TextBlock Text="Создайте чистый клиент. Выбирайте версию, нужный загрузчик и детально настраивайте моды под себя." Foreground="{StaticResource TextGray}" FontSize="13" LineHeight="19" TextWrapping="Wrap"/>
                                    </StackPanel>
                                </Grid>
                            </Border>
                        </Grid>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="Card" Property="BorderBrush" Value="{StaticResource AccentBlue}"/>
                                <Setter TargetName="Card" Property="Background" Value="#181921"/>
                                <Trigger.EnterActions><BeginStoryboard><Storyboard>
                                    <DoubleAnimation Storyboard.TargetName="Card" Storyboard.TargetProperty="(UIElement.RenderTransform).(TranslateTransform.Y)" To="-5" Duration="0:0:0.2"/>
                                    <DoubleAnimation Storyboard.TargetName="Shadow" Storyboard.TargetProperty="Opacity" To="0.3" Duration="0:0:0.2"/>
                                </Storyboard></BeginStoryboard></Trigger.EnterActions>
                                <Trigger.ExitActions><BeginStoryboard><Storyboard>
                                    <DoubleAnimation Storyboard.TargetName="Card" Storyboard.TargetProperty="(UIElement.RenderTransform).(TranslateTransform.Y)" To="0" Duration="0:0:0.2"/>
                                    <DoubleAnimation Storyboard.TargetName="Shadow" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.2"/>
                                </Storyboard></BeginStoryboard></Trigger.ExitActions>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Button.Template>
            </Button>

            <Button Tag="Secret" Grid.Row="0" Grid.Column="2" Grid.RowSpan="3" Margin="10,0,0,0" Cursor="Hand">
                <Button.Template>
                    <ControlTemplate TargetType="Button">
                        <Grid Background="Transparent">
                            <Border x:Name="Shadow" Background="#A855F7" Opacity="0" CornerRadius="22" Margin="2">
                                <Border.Effect><BlurEffect Radius="20"/></Border.Effect>
                            </Border>
                            <Border x:Name="Card" Background="{StaticResource CardBg}" CornerRadius="22" BorderBrush="{StaticResource BorderSharp}" BorderThickness="2" Padding="30" Margin="2" CacheMode="BitmapCache">
                                <Border.RenderTransform><TranslateTransform Y="0"/></Border.RenderTransform>
                                <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                    <Border Width="80" Height="80" Background="#110A1A" BorderBrush="#3B2A5E" BorderThickness="1" CornerRadius="40" Margin="0,0,0,25">
                                        <TextBlock Text="✨" Foreground="#D8B4FE" FontSize="36" VerticalAlignment="Center" HorizontalAlignment="Center">
                                            <TextBlock.Effect><DropShadowEffect BlurRadius="15" Color="#A855F7" Opacity="0.4" ShadowDepth="0"/></TextBlock.Effect>
                                        </TextBlock>
                                    </Border>
                                    <TextBlock Text="В планах" Foreground="White" FontSize="20" FontWeight="Black" HorizontalAlignment="Center" Margin="0,0,0,12"/>
                                    <TextBlock Text="Здесь скоро&#x0a;появится новая&#x0a;крутая фича!" Foreground="{StaticResource TextGray}" FontSize="13" TextAlignment="Center" HorizontalAlignment="Center" LineHeight="20"/>
                                </StackPanel>
                            </Border>
                        </Grid>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="Card" Property="BorderBrush" Value="#A855F7"/>
                                <Setter TargetName="Card" Property="Background" Value="#181521"/>
                                <Trigger.EnterActions><BeginStoryboard><Storyboard>
                                    <DoubleAnimation Storyboard.TargetName="Card" Storyboard.TargetProperty="(UIElement.RenderTransform).(TranslateTransform.Y)" To="-5" Duration="0:0:0.2"/>
                                    <DoubleAnimation Storyboard.TargetName="Shadow" Storyboard.TargetProperty="Opacity" To="0.25" Duration="0:0:0.2"/>
                                </Storyboard></BeginStoryboard></Trigger.EnterActions>
                                <Trigger.ExitActions><BeginStoryboard><Storyboard>
                                    <DoubleAnimation Storyboard.TargetName="Card" Storyboard.TargetProperty="(UIElement.RenderTransform).(TranslateTransform.Y)" To="0" Duration="0:0:0.2"/>
                                    <DoubleAnimation Storyboard.TargetName="Shadow" Storyboard.TargetProperty="Opacity" To="0" Duration="0:0:0.2"/>
                                </Storyboard></BeginStoryboard></Trigger.ExitActions>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Button.Template>
            </Button>

            <Grid Grid.Row="2" Grid.Column="0" Margin="0,0,10,0">
                <Border x:Name="Card" Background="{StaticResource CardBg}" CornerRadius="22" BorderBrush="{StaticResource BorderSharp}" BorderThickness="2" Padding="25" Opacity="0.4">
                    <StackPanel VerticalAlignment="Center">
                        <Border Width="50" Height="50" Background="#0A1F13" BorderBrush="#153B25" BorderThickness="1" CornerRadius="14" HorizontalAlignment="Left" Margin="0,0,0,15">
                            <TextBlock Text="M" Foreground="#1BD96A" FontSize="24" FontWeight="Black" VerticalAlignment="Center" HorizontalAlignment="Center"/>
                        </Border>
                        <TextBlock Text="Modrinth" Foreground="White" FontSize="18" FontWeight="Bold" Margin="0,0,0,6"/>
                        <TextBlock Text="Готовые паки" Foreground="{StaticResource TextGray}" FontSize="12"/>
                    </StackPanel>
                </Border>
                <Border Background="#D8000000" CornerRadius="22" IsHitTestVisible="False">
                    <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                        <TextBlock Text="🔒" FontSize="20" HorizontalAlignment="Center" Margin="0,0,0,5" Opacity="0.8"/>
                        <TextBlock Text="В РАЗРАБОТКЕ" Foreground="#1BD96A" FontWeight="Heavy" FontSize="11" HorizontalAlignment="Center"/>
                    </StackPanel>
                </Border>
            </Grid>

            <Grid Grid.Row="2" Grid.Column="1" Margin="10,0,10,0">
                <Border x:Name="CardCurse" Background="{StaticResource CardBg}" CornerRadius="22" BorderBrush="{StaticResource BorderSharp}" BorderThickness="2" Padding="25" Opacity="0.4">
                    <StackPanel VerticalAlignment="Center">
                        <Border Width="50" Height="50" Background="#1F120A" BorderBrush="#3B2215" BorderThickness="1" CornerRadius="14" HorizontalAlignment="Left" Margin="0,0,0,15">
                            <TextBlock Text="C" Foreground="#F16436" FontSize="24" FontWeight="Black" VerticalAlignment="Center" HorizontalAlignment="Center"/>
                        </Border>
                        <TextBlock Text="CurseForge" Foreground="White" FontSize="18" FontWeight="Bold" Margin="0,0,0,6"/>
                        <TextBlock Text="База модов" Foreground="{StaticResource TextGray}" FontSize="12"/>
                    </StackPanel>
                </Border>
                <Border Background="#D8000000" CornerRadius="22" IsHitTestVisible="False">
                    <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                        <TextBlock Text="🔒" FontSize="20" HorizontalAlignment="Center" Margin="0,0,0,5" Opacity="0.8"/>
                        <TextBlock Text="В РАЗРАБОТКЕ" Foreground="#F16436" FontWeight="Heavy" FontSize="11" HorizontalAlignment="Center"/>
                    </StackPanel>
                </Border>
            </Grid>
        </Grid>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.CreateBuildView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="700" d:DesignWidth="1100">
    
    <Grid Margin="0,70,0,80" MaxWidth="1050">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/> <RowDefinition Height="*"/>    </Grid.RowDefinitions>

        <Button Click="BackToMain_Click" HorizontalAlignment="Left" Margin="0,0,0,20" Cursor="Hand">
            <Button.Template>
                <ControlTemplate TargetType="Button">
                    <Border x:Name="backBtn" Background="#12131A" Width="42" Height="42" CornerRadius="12" BorderThickness="1" BorderBrush="#1F2026">
                        <TextBlock Text="←" Foreground="White" FontSize="18" VerticalAlignment="Center" HorizontalAlignment="Center" Margin="0,0,0,2"/>
                    </Border>
                </ControlTemplate>
            </Button.Template>
        </Button>

        <ContentControl Grid.Row="1" x:Name="PageContent" />
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.GlobalSettingsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="600" d:DesignWidth="800">

    <Grid CacheMode="BitmapCache">
        <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="0,0,15,0">
            <StackPanel Margin="10,0">

                <Border Background="#12131A" CornerRadius="18" Padding="20" Margin="0,0,0,12" 
                        BorderThickness="1" BorderBrush="#1F2026">
                    <StackPanel>
                        <Grid Margin="0,0,0,20">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="[ SYSTEM ]" Foreground="{StaticResource AccentBlue}" 
                                           FontWeight="Black" FontSize="10" Margin="0,0,15,0" Opacity="0.5"/>
                                <TextBlock Text="ОСНОВНЫЕ ПАРАМЕТРЫ" Foreground="White" FontWeight="Bold" FontSize="12"/>
                            </StackPanel>

                            <Button x:Name="KillGameBtn" Content="ЗАВЕРШИТЬ ПРОЦЕСС ИГРЫ" HorizontalAlignment="Right"
                                    Style="{StaticResource KillButtonStyle}" Click="KillGame_Click">
                                <Button.ToolTip>
                                    <ToolTip Content="Игра не запущена" BorderBrush="#FF4444"/>
                                </Button.ToolTip>
                            </Button>
                        </Grid>

                        <Border Background="#0D0E14" CornerRadius="10" Padding="12" Margin="0,0,0,15" 
                                BorderBrush="#1C1D26" BorderThickness="1">
                            <StackPanel>
                                <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                    <CheckBox x:Name="JavaCheck" Content="Автопоиск Java" IsChecked="True" Margin="0,0,20,0"/>
                                    <Button Content="Указать Java" Click="SelectJava_Click" Style="{StaticResource SecondaryButton}"
                                            IsEnabled="{Binding IsChecked, ElementName=JavaCheck, Converter={StaticResource InverseBoolConverter}}"/>
                                    <Button x:Name="ReinstallJavaBtn" Content="ПЕРЕУСТАНОВИТЬ JAVA" Margin="8,0,0,0"
                                            Click="ReinstallJava_Click" Style="{StaticResource SecondaryButton}"/>
                                    <CheckBox x:Name="ConsoleCheck" Content="Консоль при запуске" Margin="15,0,0,0" Click="ConsoleCheck_Click"/>
                                </StackPanel>
                                <TextBlock x:Name="JavaSourceBox" Text="Java: auto" Foreground="#6FA8FF" FontSize="10" Margin="2,6,0,0" Opacity="0.8"/>
                            </StackPanel>
                        </Border>

                        <StackPanel>
                            <Button Click="OpenFolder_Click" HorizontalAlignment="Left" Cursor="Hand">
                                <Button.Template>
                                    <ControlTemplate TargetType="Button">
                                        <Border x:Name="btn" Background="Transparent" Padding="0,8" BorderThickness="0,0,0,1" BorderBrush="#1AFFFFFF">
                                            <StackPanel Orientation="Horizontal">
                                                <TextBlock Text="DIR" Foreground="{StaticResource AccentBlue}" FontWeight="Black" FontSize="9" Margin="0,0,15,0"/>
                                                <TextBlock Text="ОТКРЫТЬ КОРНЕВУЮ ПАПКУ ИГРЫ" Foreground="#888" FontSize="10" FontWeight="Bold"/>
                                            </StackPanel>
                                        </Border>
                                        <ControlTemplate.Triggers>
                                            <Trigger Property="IsMouseOver" Value="True">
                                                <Setter TargetName="btn" Property="BorderBrush" Value="{StaticResource AccentBlue}"/>
                                            </Trigger>
                                        </ControlTemplate.Triggers>
                                    </ControlTemplate>
                                </Button.Template>
                            </Button>

                            <Button Click="OpenLogsFolder_Click" Margin="0,5,0,0" HorizontalAlignment="Left" Cursor="Hand">
                                <Button.Template>
                                    <ControlTemplate TargetType="Button">
                                        <Border x:Name="btn" Background="Transparent" Padding="0,8" BorderThickness="0,0,0,1" BorderBrush="#1AFFFFFF">
                                            <StackPanel Orientation="Horizontal">
                                                <TextBlock Text="LOGS" Foreground="#FFCC00" FontWeight="Black" FontSize="9" Margin="0,0,15,0"/>
                                                <TextBlock Text="ПОСМОТРЕТЬ ЖУРНАЛ СОБЫТИЙ" Foreground="#888" FontSize="10" FontWeight="Bold"/>
                                            </StackPanel>
                                        </Border>
                                        <ControlTemplate.Triggers>
                                            <Trigger Property="IsMouseOver" Value="True">
                                                <Setter TargetName="btn" Property="BorderBrush" Value="#FFCC00"/>
                                            </Trigger>
                                        </ControlTemplate.Triggers>
                                    </ControlTemplate>
                                </Button.Template>
                            </Button>
                        </StackPanel>
                    </StackPanel>
                </Border>

                <Border Background="#12131A" CornerRadius="18" Padding="20" Margin="0,0,0,12" 
                        BorderThickness="1" BorderBrush="#1F2026">
                    <StackPanel>
                        <Grid Margin="0,0,0,20">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="[ RAM ]" Foreground="{StaticResource AccentBlue}" FontWeight="Black" FontSize="10" Margin="0,0,15,0" Opacity="0.5"/>
                                <TextBlock Text="ВЫДЕЛЕНИЕ ПАМЯТИ" Foreground="White" FontWeight="Bold" FontSize="12"/>
                            </StackPanel>
                            <StackPanel Orientation="Horizontal" HorizontalAlignment="Right">
                                <TextBlock x:Name="GbText" Text="4.0 GB" Foreground="{StaticResource AccentBlue}" FontWeight="Bold" FontSize="11" Margin="0,0,10,0"/>
                                <Border Background="#0B0C12" CornerRadius="8" Padding="8,3" BorderThickness="1" BorderBrush="#2A2D3A">
                                    <TextBox x:Name="RamInput" Text="4096" Foreground="White" Background="Transparent" BorderThickness="0" Width="60" 
                                             TextAlignment="Center" CaretBrush="{StaticResource AccentBlue}" TextChanged="RamInput_TextChanged"/>
                                </Border>
                            </StackPanel>
                        </Grid>
                        <Slider x:Name="RamSlider" Minimum="1024" Maximum="16384" Value="4096" TickFrequency="512" 
                                IsSnapToTickEnabled="True" ValueChanged="RamSlider_ValueChanged" Style="{StaticResource ModernSliderStyle}"/>
                    </StackPanel>
                </Border>

                <Border Background="#0A0B10" CornerRadius="18" Padding="15" BorderThickness="1" BorderBrush="#1A1B23">
                    <StackPanel>
                        <Grid Margin="5,0,5,10">
                            <StackPanel Orientation="Horizontal">
                                <TextBlock Text="TERMINAL" Foreground="#444" FontWeight="Black" FontSize="10" Margin="0,0,12,0"/>
                                <Button Content="COPY" Click="CopyLogs_Click" Style="{StaticResource SecondaryButton}"/>
                            </StackPanel>
                            <Button Content="CLEAR" HorizontalAlignment="Right" Click="ClearLogs_Click" Style="{StaticResource SecondaryButton}"/>
                        </Grid>
                        <Border Background="#040406" CornerRadius="12" BorderThickness="1" BorderBrush="#111">
                            <ScrollViewer x:Name="LogScroll" Margin="10" Height="120" VerticalScrollBarVisibility="Auto">
                                <TextBlock x:Name="LogText" Text="[SYSTEM] Waiting for command..." Foreground="#444" 
                                           FontSize="10" FontFamily="Consolas" TextWrapping="Wrap"/>
                            </ScrollViewer>
                        </Border>
                    </StackPanel>
                </Border>
            </StackPanel>
        </ScrollViewer>
    </Grid>
</UserControl>
<UserControl x:Class="SubReelLauncher.Presentation.Views.Pages.NewsView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="600" d:DesignWidth="800">

    <Grid x:Name="NewsRoot">
        <Grid.RenderTransform>
            <TranslateTransform Y="0"/>
        </Grid.RenderTransform>

        <ScrollViewer VerticalScrollBarVisibility="Auto" Padding="0,0,15,0" CanContentScroll="True">
            <ItemsControl x:Name="NewsItemsControl" 
                          ItemsSource="{Binding NewsCollection}"
                          VirtualizingStackPanel.IsVirtualizing="True" 
                          VirtualizingStackPanel.VirtualizationMode="Recycling">
                <ItemsControl.ItemsPanel>
                    <ItemsPanelTemplate>
                        <VirtualizingStackPanel IsVirtualizing="True" VirtualizationMode="Recycling"/>
                    </ItemsPanelTemplate>
                </ItemsControl.ItemsPanel>

                <ItemsControl.ItemTemplate>
                    <DataTemplate>
                        <Border Margin="0,0,0,30" Background="#111217" CornerRadius="20" BorderThickness="1" BorderBrush="#1C1D26">
                            <Border.Effect>
                                <DropShadowEffect BlurRadius="8" Opacity="0.1" ShadowDepth="1" Color="Black"/>
                            </Border.Effect>

                            <Grid>
                                <Border Width="4" Background="{Binding AccentBrush}" HorizontalAlignment="Left" 
                                        VerticalAlignment="Stretch" Margin="0,30,0,30" CornerRadius="0,20,20,0"/>

                                <StackPanel Margin="35,30,35,30">
                                    <Grid Margin="0,0,0,15">
                                        <Grid.ColumnDefinitions>
                                            <ColumnDefinition Width="Auto"/>
                                            <ColumnDefinition Width="*"/>
                                        </Grid.ColumnDefinitions>

                                        <Border Background="#0AFFFFFF" CornerRadius="6" Padding="10,5" 
                                                BorderThickness="1" BorderBrush="{Binding AccentBrush}">
                                            <TextBlock Text="{Binding Category}" Foreground="{Binding AccentBrush}" 
                                                       FontSize="10" FontWeight="Black"/>
                                        </Border>

                                        <TextBlock Grid.Column="1" Text="{Binding Date}" Foreground="#777" 
                                                   FontSize="11" Margin="15,0,0,0" VerticalAlignment="Center" FontWeight="Bold"/>
                                    </Grid>

                                    <TextBlock Text="{Binding Title}" Foreground="White" FontSize="26" 
                                               FontWeight="Black" TextWrapping="Wrap" Margin="0,0,0,12"/>

                                    <TextBlock Text="{Binding Description}" Foreground="#A1A1A8" FontSize="14" 
                                               LineHeight="22" TextWrapping="Wrap" Margin="0,0,0,25"/>

                                    <Border Background="#08080A" CornerRadius="16" BorderThickness="1" 
                                            BorderBrush="#1A1B23" Padding="25,20">
                                        <ItemsControl ItemsSource="{Binding Changes}">
                                            <ItemsControl.ItemTemplate>
                                                <DataTemplate>
                                                    <Grid Margin="0,6">
                                                        <Grid.ColumnDefinitions>
                                                            <ColumnDefinition Width="20"/>
                                                            <ColumnDefinition Width="*"/>
                                                        </Grid.ColumnDefinitions>
                                                        <Ellipse Width="6" Height="6" Fill="{StaticResource AccentBlue}" 
                                                                 HorizontalAlignment="Left" VerticalAlignment="Top" 
                                                                 Margin="0,7,0,0" Opacity="0.9"/>
                                                        <TextBlock Grid.Column="1" Text="{Binding}" Foreground="#CCCCCC" 
                                                                   FontSize="13" LineHeight="20" TextWrapping="Wrap"/>
                                                    </Grid>
                                                </DataTemplate>
                                            </ItemsControl.ItemTemplate>
                                        </ItemsControl>
                                    </Border>

                                    <Button Content="{Binding ButtonText}" Tag="{Binding ButtonUrl}" 
                                            Visibility="{Binding ButtonVisibility}" Click="OpenNewsUrl_Click" 
                                            Margin="0,25,0,0" HorizontalAlignment="Left" Cursor="Hand">
                                        <Button.Template>
                                            <ControlTemplate TargetType="Button">
                                                <Border x:Name="BtnBg" Background="#0CFFFFFF" BorderThickness="1" 
                                                        BorderBrush="#22FFFFFF" CornerRadius="12" Padding="20,12">
                                                    <StackPanel Orientation="Horizontal">
                                                        <TextBlock x:Name="t" Text="{TemplateBinding Content}" Foreground="#E0E0E0" FontSize="11" FontWeight="Black"/>
                                                        <TextBlock x:Name="icon" Text="➔" Foreground="{StaticResource AccentBlue}" Margin="10,0,0,0" FontSize="11" FontWeight="Black" VerticalAlignment="Center"/>
                                                    </StackPanel>
                                                </Border>
                                                <ControlTemplate.Triggers>
                                                    <Trigger Property="IsMouseOver" Value="True">
                                                        <Setter TargetName="BtnBg" Property="Background" Value="#1AFFFFFF"/>
                                                        <Setter TargetName="t" Property="Foreground" Value="White"/>
                                                        <Setter TargetName="icon" Property="Foreground" Value="White"/>
                                                    </Trigger>
                                                    <Trigger Property="IsPressed" Value="True">
                                                        <Setter TargetName="BtnBg" Property="Background" Value="{StaticResource AccentBlue}"/>
                                                        <Setter TargetName="BtnBg" Property="BorderBrush" Value="{StaticResource AccentBlue}"/>
                                                    </Trigger>
                                                </ControlTemplate.Triggers>
                                            </ControlTemplate>
                                        </Button.Template>
                                    </Button>
                                </StackPanel>
                            </Grid>
                        </Border>
                    </DataTemplate>
                </ItemsControl.ItemTemplate>
            </ItemsControl>
        </ScrollViewer>
    </Grid>
</UserControl>
<Window x:Class="SubReelLauncher.Presentation.Views.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:shell="clr-namespace:System.Windows.Shell;assembly=PresentationFramework"
        xmlns:local="clr-namespace:SubReelLauncher"
        xmlns:controls="clr-namespace:SubReelLauncher.Presentation.Views.Controls"
        xmlns:overlays="clr-namespace:SubReelLauncher.Presentation.Views.Controls.Overlays"
        Title="SubReel Studio" Height="700" Width="1100" 
        Background="Transparent" WindowStartupLocation="CenterScreen"
        AllowsTransparency="True" WindowStyle="None"
        ResizeMode="CanResizeWithGrip"
        UseLayoutRounding="True" 
        SnapsToDevicePixels="True"
        TextOptions.TextFormattingMode="Display"
        TextOptions.TextRenderingMode="ClearType"
        RenderOptions.BitmapScalingMode="HighQuality" Icon="/Assets/SubReel.ico">

    <shell:WindowChrome.WindowChrome>
        <shell:WindowChrome CaptionHeight="40" 
                            GlassFrameThickness="1" 
                            CornerRadius="0" 
                            ResizeBorderThickness="6"
                            NonClientFrameEdges="None"/>
    </shell:WindowChrome.WindowChrome>

    <Window.Resources>
        <Storyboard x:Key="FadeInAuth">
            <DoubleAnimation Storyboard.TargetName="AuthOverlay" Storyboard.TargetProperty="Opacity" From="0" To="1" Duration="0:0:0.3"/>
        </Storyboard>
    </Window.Resources>

    <Grid x:Name="MainRoot">
        <Border x:Name="MainBackground" 
                CornerRadius="20" 
                Background="{StaticResource BgDark}" 
                BorderThickness="2" 
                BorderBrush="{StaticResource BorderSharp}" 
                MouseLeftButtonDown="MainBackground_MouseLeftButtonDown">

            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="220"/>
                    <ColumnDefinition Width="*"/>
                </Grid.ColumnDefinitions>

                <Grid.RowDefinitions>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="80"/>
                </Grid.RowDefinitions>

                <Border Grid.Column="0" Grid.RowSpan="2" 
                        Background="#0A0A0E" 
                        CornerRadius="20,0,0,20" 
                        BorderThickness="0,0,2,0" 
                        BorderBrush="{StaticResource BorderSharp}">
                    <ContentControl Content="{Binding SidebarViewModel}" />
                </Border>

                <Grid Grid.Column="1" Grid.Row="0">
                    <ContentPresenter Content="{Binding CurrentPage}" Margin="20"/>
                </Grid>

                <Border Grid.Column="1" Grid.Row="1" 
                        Background="#0D0D12" 
                        BorderThickness="0,2,0,0" 
                        BorderBrush="{StaticResource BorderSharp}">
                    <ContentControl Content="{Binding StatusBarViewModel}" />
                </Border>
            </Grid>
        </Border>

        <Canvas x:Name="NotificationCanvas" IsHitTestVisible="False" Panel.ZIndex="999">
            <ContentControl x:Name="NotificationArea" />
        </Canvas>

        <Grid x:Name="OverlayContainer" Panel.ZIndex="1000" Visibility="Collapsed">
            <Border Background="#CC000000" />
            <ContentControl Content="{Binding CurrentOverlay}" 
                            HorizontalAlignment="Center" 
                            VerticalAlignment="Center"/>
        </Grid>

        <StackPanel Orientation="Horizontal" 
                    HorizontalAlignment="Right" 
                    VerticalAlignment="Top" 
                    Margin="0,15,15,0" 
                    Panel.ZIndex="9999">
            <Button Content="─" Click="MinimizeBtn_Click" Style="{StaticResource ControlButtonStyle}" shell:WindowChrome.IsHitTestVisibleInChrome="True"/>
            <Button Content="▢" Click="MaximizeBtn_Click" Style="{StaticResource ControlButtonStyle}" shell:WindowChrome.IsHitTestVisibleInChrome="True"/>
            <Button Content="✕" Click="CloseBtn_Click" Style="{StaticResource ControlButtonStyle}" shell:WindowChrome.IsHitTestVisibleInChrome="True"/>
        </StackPanel>
    </Grid>
</Window>
using CmlLib.Core;
using CmlLib.Core.Auth;
using CmlLib.Core.VersionMetadata;
using SubReelLauncher.Presentation.ViewModels;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using System.Windows.Shell;
using System.Windows.Threading;





namespace SubReelLauncher.Presentation.Views.Controls
{
    public partial class MainWindow : Window
    {
        public MainViewModel ViewModel { get; set; }

        public MainWindow()
        {
            InitializeComponent();
            ViewModel = new MainViewModel();
            this.DataContext = ViewModel; // Теперь биндинги в XAML увидят ViewModel
        }

        // Пример обработки клика в Sidebar для смены страницы
        private void BtnSettings_Click(object sender, RoutedEventArgs e)
        {
            ViewModel.Navigate("Settings");
            // Обновите UI кнопок (подсветку), если не используете чистое MVVM через Commands
        }
    }

}
<Application x:Class="SubReelLauncher.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             StartupUri="Presentation/Views/MainWindow.xaml">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="/Presentation/Resources/Styles.xaml"/>
                <ResourceDictionary Source="/Presentation/Resources/Colors.xaml"/>
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>
