package online.subreel.status;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import io.papermc.paper.event.player.AsyncChatEvent;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.OfflinePlayer;
import org.bukkit.Statistic;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerAdvancementDoneEvent;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;

public final class SubreelStatusPlugin extends JavaPlugin implements Listener {
    private static final String DEFAULT_STATUS_PATH = "/status";
    private static final String DEFAULT_WORLD_STATS_PATH = "/world-stats";

    private HttpServer httpServer;
    private HttpClient httpClient;
    private String configuredStatusPath;
    private String configuredWorldStatsPath;
    private String configuredToken;
    private boolean includeMotd;
    private boolean includeVersion;
    private int leaderboardLimit;
    private File statsDataFile;
    private YamlConfiguration statsData;
    private final Map<UUID, Long> chatMessageCounts = new HashMap<>();
    private final Map<UUID, Long> advancementCounts = new HashMap<>();
    private long totalChatMessages = 0;
    private int pendingChatWrites = 0;
    private boolean localHttpEnabled;
    private boolean pushEnabled;
    private String pushBaseUrl;
    private String pushStatusPath;
    private String pushWorldStatsPath;
    private String pushToken;
    private int pushIntervalSeconds;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        configuredStatusPath = normalizePath(getConfig().getString("http.path", DEFAULT_STATUS_PATH), DEFAULT_STATUS_PATH);
        configuredWorldStatsPath = normalizePath(getConfig().getString("http.statsPath", DEFAULT_WORLD_STATS_PATH), DEFAULT_WORLD_STATS_PATH);
        configuredToken = getConfig().getString("http.token", "change-me-subreel-token");
        includeMotd = getConfig().getBoolean("response.includeMotd", true);
        includeVersion = getConfig().getBoolean("response.includeVersion", true);
        leaderboardLimit = Math.max(1, getConfig().getInt("response.leaderboardLimit", 24));
        localHttpEnabled = getConfig().getBoolean("http.enabled", true);
        pushEnabled = getConfig().getBoolean("push.enabled", false);
        pushBaseUrl = stripTrailingSlash(getConfig().getString("push.baseUrl", ""));
        pushStatusPath = normalizePath(getConfig().getString("push.statusPath", "/api/internal/server-sync/status"), "/api/internal/server-sync/status");
        pushWorldStatsPath = normalizePath(getConfig().getString("push.worldStatsPath", "/api/internal/server-sync/world-stats"), "/api/internal/server-sync/world-stats");
        pushToken = getConfig().getString("push.token", configuredToken);
        pushIntervalSeconds = Math.max(10, getConfig().getInt("push.intervalSeconds", 20));

        loadStatsData();
        getServer().getPluginManager().registerEvents(this, this);

        httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

        if (localHttpEnabled) {
            startLocalHttpBridge();
        } else {
            getLogger().info("Local HTTP bridge disabled by config.");
        }

        if (pushEnabled && !pushBaseUrl.isBlank()) {
            startPushSyncTask();
            getLogger().info("Push sync enabled: " + pushBaseUrl);
        } else {
            getLogger().info("Push sync disabled. Set push.enabled=true and push.baseUrl to enable online sync to the website.");
        }

        startBanCleanupTask();
    }

    @Override
    public void onDisable() {
        saveStatsData();

        if (httpServer != null) {
            httpServer.stop(0);
            httpServer = null;
        }
    }

    @EventHandler
    public void onAsyncChat(AsyncChatEvent event) {
        UUID playerId = event.getPlayer().getUniqueId();
        chatMessageCounts.merge(playerId, 1L, Long::sum);
        totalChatMessages += 1;
        pendingChatWrites += 1;

        if (pendingChatWrites >= 25) {
            saveStatsData();
            pendingChatWrites = 0;
        }
    }

    @EventHandler
    public void onPlayerAdvancementDone(PlayerAdvancementDoneEvent event) {
        Player player = event.getPlayer();
        long advancements = countCompletedAdvancementsLive(player);
        advancementCounts.put(player.getUniqueId(), advancements);
        pendingChatWrites += 1;

        if (pendingChatWrites >= 25) {
            saveStatsData();
            pendingChatWrites = 0;
        }
    }

    @EventHandler
    public void onPlayerLogin(PlayerLoginEvent event) {
        if (event.getResult() != PlayerLoginEvent.Result.KICK_BANNED) {
            return;
        }

        Player player = event.getPlayer();
        if (removePlayerProfile(player.getUniqueId())) {
            saveStatsData();
            getLogger().info("Removed stats profile for banned player on login check: " + player.getName() + " (" + player.getUniqueId() + ")");
        }
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!command.getName().equalsIgnoreCase("subreelstats")) {
            return false;
        }

        if (!sender.hasPermission("subreelstats.manage")) {
            sender.sendMessage("§cNo permission.");
            return true;
        }

        if (args.length == 0) {
            sender.sendMessage("§7Usage: /subreelstats purge <nick|uuid> | /subreelstats purgebanned | /subreelstats merge <from> <to>");
            return true;
        }

        if (args[0].equalsIgnoreCase("purgebanned")) {
            int removed = purgeBannedProfiles();
            sender.sendMessage("§aPurged banned profiles: §f" + removed);
            return true;
        }

        if (args[0].equalsIgnoreCase("purge")) {
            if (args.length < 2) {
                sender.sendMessage("§cUsage: /subreelstats purge <nick|uuid>");
                return true;
            }

            UUID targetId = resolvePlayerUuid(args[1]);
            if (targetId == null) {
                sender.sendMessage("§cPlayer not found by nick/uuid.");
                return true;
            }

            if (removePlayerProfile(targetId)) {
                saveStatsData();
                sender.sendMessage("§aProfile removed: §f" + targetId);
            } else {
                sender.sendMessage("§eProfile not found in stats: §f" + targetId);
            }
            return true;
        }

        if (args[0].equalsIgnoreCase("merge")) {
            if (args.length < 3) {
                sender.sendMessage("§cUsage: /subreelstats merge <from> <to>");
                return true;
            }

            UUID fromId = resolvePlayerUuid(args[1]);
            UUID toId = resolvePlayerUuid(args[2]);

            if (fromId == null || toId == null) {
                sender.sendMessage("§cPlayer not found by nick/uuid.");
                return true;
            }

            if (fromId.equals(toId)) {
                sender.sendMessage("§eCannot merge the same profile into itself.");
                return true;
            }

            if (mergePlayerProfiles(fromId, toId)) {
                saveStatsData();
                sender.sendMessage("§aMerged profile: §f" + fromId + " §7-> §f" + toId);
            } else {
                sender.sendMessage("§eNothing to merge. Source profile was not found.");
            }
            return true;
        }

        sender.sendMessage("§7Usage: /subreelstats purge <nick|uuid> | /subreelstats purgebanned | /subreelstats merge <from> <to>");
        return true;
    }

    private void startBanCleanupTask() {
        Bukkit.getScheduler().runTaskTimer(this, () -> {
            int removed = purgeBannedProfiles();
            if (removed > 0) {
                getLogger().info("Auto-purged banned profiles: " + removed);
            }
        }, 20L * 60L, 20L * 60L);
    }

    private void startLocalHttpBridge() {
        String host = getConfig().getString("http.host", "127.0.0.1");
        int port = getConfig().getInt("http.port", 8127);

        try {
            httpServer = HttpServer.create(new InetSocketAddress(host, port), 0);
            httpServer.createContext(configuredStatusPath, new StatusHandler());
            httpServer.createContext(configuredWorldStatsPath, new WorldStatsHandler());
            httpServer.setExecutor(Executors.newSingleThreadExecutor());
            httpServer.start();

            getLogger().info("Subreel status bridge started on http://" + host + ":" + port + configuredStatusPath);
            getLogger().info("Subreel world stats bridge started on http://" + host + ":" + port + configuredWorldStatsPath);
        } catch (IOException exception) {
            getLogger().severe("Failed to start Subreel status bridge: " + exception.getMessage());
        }
    }

    private void startPushSyncTask() {
        long periodTicks = pushIntervalSeconds * 20L;

        Bukkit.getScheduler().runTaskTimerAsynchronously(this, () -> {
            try {
                StatusSnapshot statusSnapshot = runOnMainThread(this::createStatusSnapshot);
                WorldStatsSnapshot worldStatsSnapshot = runOnMainThread(this::createWorldStatsSnapshot);

                pushJson(pushStatusPath, statusSnapshot.toJson());
                pushJson(pushWorldStatsPath, worldStatsSnapshot.toJson());
            } catch (Exception exception) {
                getLogger().warning("Push sync failed: " + exception.getMessage());
            }
        }, 40L, periodTicks);
    }

    private void pushJson(String path, String json) throws IOException, InterruptedException {
        if (pushBaseUrl.isBlank()) {
            return;
        }

        String target = pushBaseUrl + path;
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(target))
            .timeout(Duration.ofSeconds(10))
            .header("Content-Type", "application/json; charset=utf-8")
            .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8));

        if (pushToken != null && !pushToken.isBlank()) {
            builder.header("Authorization", "Bearer " + pushToken);
        }

        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("sync_failed_" + response.statusCode() + ": " + response.body());
        }
    }

    private void loadStatsData() {
        if (!getDataFolder().exists()) {
            getDataFolder().mkdirs();
        }

        statsDataFile = new File(getDataFolder(), "stats-data.yml");
        statsData = YamlConfiguration.loadConfiguration(statsDataFile);
        totalChatMessages = statsData.getLong("totals.chatMessages", 0L);

        if (statsData.isConfigurationSection("players")) {
            for (String key : statsData.getConfigurationSection("players").getKeys(false)) {
                try {
                    UUID playerId = UUID.fromString(key);
                    long chatMessages = statsData.getLong("players." + key + ".chatMessages", 0L);
                    if (chatMessages > 0) {
                        chatMessageCounts.put(playerId, chatMessages);
                    }

                    long advancements = statsData.getLong("players." + key + ".advancements", 0L);
                    if (advancements > 0) {
                        advancementCounts.put(playerId, advancements);
                    }
                } catch (IllegalArgumentException ignored) {
                    // Skip malformed UUIDs.
                }
            }
        }
    }

    private void saveStatsData() {
        if (statsData == null || statsDataFile == null) {
            return;
        }

        statsData.set("totals.chatMessages", totalChatMessages);
        statsData.set("players", null);

        for (Map.Entry<UUID, Long> entry : chatMessageCounts.entrySet()) {
            statsData.set("players." + entry.getKey() + ".chatMessages", entry.getValue());
        }

        for (Map.Entry<UUID, Long> entry : advancementCounts.entrySet()) {
            statsData.set("players." + entry.getKey() + ".advancements", entry.getValue());
        }

        try {
            statsData.save(statsDataFile);
        } catch (IOException exception) {
            getLogger().warning("Failed to save stats data: " + exception.getMessage());
        }
    }

    private String normalizePath(String path, String fallback) {
        if (path == null || path.isBlank()) {
            return fallback;
        }
        return path.startsWith("/") ? path : "/" + path;
    }

    private String stripTrailingSlash(String value) {
        if (value == null) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private UUID resolvePlayerUuid(String input) {
        try {
            return UUID.fromString(input);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, try name lookup.
        }

        for (OfflinePlayer offlinePlayer : Bukkit.getOfflinePlayers()) {
            String name = offlinePlayer.getName();
            if (name != null && name.equalsIgnoreCase(input)) {
                return offlinePlayer.getUniqueId();
            }
        }

        return null;
    }

    private int purgeBannedProfiles() {
        int removed = 0;
        for (OfflinePlayer offlinePlayer : Bukkit.getOfflinePlayers()) {
            if (!offlinePlayer.isBanned()) {
                continue;
            }

            if (removePlayerProfile(offlinePlayer.getUniqueId())) {
                removed += 1;
            }
        }

        if (removed > 0) {
            saveStatsData();
        }

        return removed;
    }

    private boolean removePlayerProfile(UUID playerId) {
        Objects.requireNonNull(playerId, "playerId");

        long removedChatMessages = chatMessageCounts.remove(playerId) != null
            ? statsData.getLong("players." + playerId + ".chatMessages", 0L)
            : 0L;
        boolean removedAdvancements = advancementCounts.remove(playerId) != null;
        statsData.set("players." + playerId, null);

        if (removedChatMessages > 0) {
            totalChatMessages = Math.max(0L, totalChatMessages - removedChatMessages);
            statsData.set("totals.chatMessages", totalChatMessages);
        }

        return removedChatMessages > 0 || removedAdvancements;
    }

    private boolean mergePlayerProfiles(UUID fromPlayerId, UUID toPlayerId) {
        Objects.requireNonNull(fromPlayerId, "fromPlayerId");
        Objects.requireNonNull(toPlayerId, "toPlayerId");

        var playersSection = statsData.getConfigurationSection("players");
        long fromChatMessages = chatMessageCounts.getOrDefault(fromPlayerId, 0L);
        long toChatMessages = chatMessageCounts.getOrDefault(toPlayerId, 0L);
        long fromAdvancements = advancementCounts.getOrDefault(fromPlayerId, 0L);
        long toAdvancements = advancementCounts.getOrDefault(toPlayerId, 0L);

        boolean hasSourceProfile = fromChatMessages > 0
            || fromAdvancements > 0
            || playersSection != null && playersSection.contains(fromPlayerId.toString());

        if (!hasSourceProfile) {
            return false;
        }

        if (fromChatMessages > 0 || toChatMessages > 0) {
            chatMessageCounts.put(toPlayerId, fromChatMessages + toChatMessages);
        }

        if (fromAdvancements > 0 || toAdvancements > 0) {
            advancementCounts.put(toPlayerId, Math.max(fromAdvancements, toAdvancements));
        }

        chatMessageCounts.remove(fromPlayerId);
        advancementCounts.remove(fromPlayerId);
        statsData.set("players." + fromPlayerId, null);

        return true;
    }

    private boolean isAuthorized(Headers headers) {
        if (configuredToken == null || configuredToken.isBlank()) {
            return true;
        }

        String authHeader = headers.getFirst("Authorization");
        if (authHeader != null && authHeader.equals("Bearer " + configuredToken)) {
            return true;
        }

        String tokenHeader = headers.getFirst("X-Subreel-Token");
        return configuredToken.equals(tokenHeader);
    }

    private final class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    writeJson(exchange, 405, "{\"ok\":false,\"error\":\"method_not_allowed\"}");
                    return;
                }

                if (!isAuthorized(exchange.getRequestHeaders())) {
                    writeJson(exchange, 401, "{\"ok\":false,\"error\":\"unauthorized\"}");
                    return;
                }

                StatusSnapshot snapshot = runOnMainThread(SubreelStatusPlugin.this::createStatusSnapshot);
                writeJson(exchange, 200, snapshot.toJson());
            } catch (Throwable throwable) {
                safeWriteJson(exchange, 500, "{\"ok\":false,\"error\":\"internal_error\"}");
                getLogger().warning("Status request failed: " + throwable.getMessage());
            }
        }
    }

    private final class WorldStatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            try {
                if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                    writeJson(exchange, 405, "{\"ok\":false,\"error\":\"method_not_allowed\"}");
                    return;
                }

                if (!isAuthorized(exchange.getRequestHeaders())) {
                    writeJson(exchange, 401, "{\"ok\":false,\"error\":\"unauthorized\"}");
                    return;
                }

                WorldStatsSnapshot snapshot = runOnMainThread(SubreelStatusPlugin.this::createWorldStatsSnapshot);
                writeJson(exchange, 200, snapshot.toJson());
            } catch (Throwable throwable) {
                safeWriteJson(exchange, 500, "{\"ok\":false,\"error\":\"internal_error\"}");
                getLogger().warning("World stats request failed: " + throwable.getMessage());
            }
        }
    }

    private <T> T runOnMainThread(CheckedSupplier<T> supplier) throws Exception {
        if (Bukkit.isPrimaryThread()) {
            return supplier.get();
        }

        try {
            return Bukkit.getScheduler().callSyncMethod(this, supplier::get).get();
        } catch (ExecutionException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof Exception wrapped) {
                throw wrapped;
            }
            throw new RuntimeException(cause);
        }
    }

    private StatusSnapshot createStatusSnapshot() {
        int playersOnline = Bukkit.getOnlinePlayers().size();
        int playersMax = Bukkit.getMaxPlayers();
        String motd = includeMotd ? ChatColor.stripColor(Bukkit.getMotd()) : "";
        String version = includeVersion ? Bukkit.getMinecraftVersion() : "";
        String tps = resolveTps();
        List<String> samplePlayers = Bukkit.getOnlinePlayers().stream()
            .map(Player::getName)
            .sorted(String::compareToIgnoreCase)
            .toList();

        return new StatusSnapshot(
            true,
            true,
            "93.88.206.6:20633",
            "93.88.206.6",
            Bukkit.getPort(),
            version,
            playersOnline,
            playersMax,
            samplePlayers,
            motd,
            tps,
            Instant.now().toString()
        );
    }

    private WorldStatsSnapshot createWorldStatsSnapshot() {
        WorldTotals totals = new WorldTotals();
        List<PlayerStatsEntry> leaderboard = new ArrayList<>();

        for (OfflinePlayer offlinePlayer : Bukkit.getOfflinePlayers()) {
            if (offlinePlayer.isBanned()) {
                removePlayerProfile(offlinePlayer.getUniqueId());
                continue;
            }

            String name = offlinePlayer.getName();
            if (name == null || name.isBlank()) {
                continue;
            }

            boolean seenBefore = offlinePlayer.hasPlayedBefore() || offlinePlayer.isOnline();
            if (!seenBefore) {
                continue;
            }

            long playTicks = getSimpleStatistic(offlinePlayer, "PLAY_ONE_MINUTE", "PLAY_TIME");
            long deaths = getSimpleStatistic(offlinePlayer, "DEATHS");
            long playerKills = getSimpleStatistic(offlinePlayer, "PLAYER_KILLS");
            long mobKills = getSimpleStatistic(offlinePlayer, "MOB_KILLS");
            long distanceWalked = getSimpleStatistic(offlinePlayer, "WALK_ONE_CM");
            long distanceSwum = getSimpleStatistic(offlinePlayer, "SWIM_ONE_CM");
            long blocksBroken = getMaterialStatisticSum(offlinePlayer, "MINE_BLOCK", Material::isBlock);
            long blocksPlaced = getMaterialStatisticSum(offlinePlayer, "USE_ITEM", Material::isBlock);
            long itemsCrafted = getMaterialStatisticSum(offlinePlayer, "CRAFT_ITEM", material -> true);
            long chatMessages = chatMessageCounts.getOrDefault(offlinePlayer.getUniqueId(), 0L);
            long achievements = countCompletedAdvancements(offlinePlayer);

            totals.playTicks += playTicks;
            totals.deaths += deaths;
            totals.playerKills += playerKills;
            totals.mobKills += mobKills;
            totals.blocksBroken += blocksBroken;
            totals.blocksPlaced += blocksPlaced;
            totals.itemsCrafted += itemsCrafted;
            totals.distanceWalkedCm += distanceWalked;
            totals.distanceSwumCm += distanceSwum;
            totals.chatMessages += chatMessages;
            totals.achievements += achievements;
            totals.uniquePlayers += 1;

            leaderboard.add(new PlayerStatsEntry(
                name,
                offlinePlayer.isOnline(),
                playTicks,
                deaths,
                playerKills,
                mobKills,
                blocksBroken,
                blocksPlaced,
                distanceWalked,
                distanceSwum
            ));
        }

        leaderboard.sort(Comparator.comparingLong(PlayerStatsEntry::playTicks).reversed());
        if (leaderboard.size() > leaderboardLimit) {
            leaderboard = new ArrayList<>(leaderboard.subList(0, leaderboardLimit));
        }

        totals.chatMessages = Math.max(totals.chatMessages, totalChatMessages);

        return new WorldStatsSnapshot(
            true,
            totals,
            leaderboard,
            Instant.now().toString()
        );
    }

    private long getSimpleStatistic(OfflinePlayer player, String... statisticNames) {
        Statistic statistic = resolveStatistic(statisticNames);
        if (statistic == null || statistic.getType() != Statistic.Type.UNTYPED) {
            return 0L;
        }

        try {
            return Math.max(player.getStatistic(statistic), 0);
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private long getMaterialStatisticSum(OfflinePlayer player, String statisticName, MaterialPredicate predicate) {
        Statistic statistic = resolveStatistic(statisticName);
        if (statistic == null || statistic.getType() != Statistic.Type.BLOCK && statistic.getType() != Statistic.Type.ITEM) {
            return 0L;
        }

        long total = 0L;
        for (Material material : Material.values()) {
            if (!predicate.test(material)) {
                continue;
            }

            try {
                total += Math.max(player.getStatistic(statistic, material), 0);
            } catch (Exception ignored) {
                // Some materials may not be valid for a specific statistic.
            }
        }

        return total;
    }

    private Statistic resolveStatistic(String... names) {
        for (String name : names) {
            try {
                return Statistic.valueOf(name);
            } catch (IllegalArgumentException ignored) {
                // Try next alias.
            }
        }
        return null;
    }

    private long countCompletedAdvancements(OfflinePlayer offlinePlayer) {
        if (!offlinePlayer.isOnline()) {
            return advancementCounts.getOrDefault(offlinePlayer.getUniqueId(), 0L);
        }

        Player player = offlinePlayer.getPlayer();
        if (player == null) {
            return advancementCounts.getOrDefault(offlinePlayer.getUniqueId(), 0L);
        }

        long count = countCompletedAdvancementsLive(player);
        advancementCounts.put(player.getUniqueId(), count);
        return count;
    }

    private long countCompletedAdvancementsLive(Player player) {
        long count = 0L;
        for (var iterator = Bukkit.advancementIterator(); iterator.hasNext(); ) {
            var advancement = iterator.next();
            if (!shouldCountAdvancement(advancement)) {
                continue;
            }

            if (player.getAdvancementProgress(advancement).isDone()) {
                count += 1;
            }
        }
        return count;
    }

    private boolean shouldCountAdvancement(org.bukkit.advancement.Advancement advancement) {
        String key = advancement.getKey().getKey();
        if (key.startsWith("recipes/")) {
            return false;
        }

        try {
            Method getParentMethod = advancement.getClass().getMethod("getParent");
            Object parent = getParentMethod.invoke(advancement);
            if (parent == null) {
                return false;
            }
        } catch (NoSuchMethodException ignored) {
            // Parent API is not available on all versions.
        } catch (Exception ignored) {
            return false;
        }

        try {
            Method getDisplayMethod = advancement.getClass().getMethod("getDisplay");
            Object display = getDisplayMethod.invoke(advancement);
            if (display == null) {
                return false;
            }

            try {
                Method isHiddenMethod = display.getClass().getMethod("isHidden");
                Object hidden = isHiddenMethod.invoke(display);
                if (hidden instanceof Boolean hiddenValue && hiddenValue) {
                    return false;
                }
            } catch (NoSuchMethodException ignored) {
                // Hidden flag is not available on all API versions.
            }

            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private String resolveTps() {
        try {
            Method getTpsMethod = Bukkit.getServer().getClass().getMethod("getTPS");
            Object result = getTpsMethod.invoke(Bukkit.getServer());

            if (result instanceof double[] tpsArray && tpsArray.length > 0) {
                return String.format(Locale.US, "%.2f", tpsArray[0]);
            }
        } catch (Exception ignored) {
            // Paper-specific API may be absent on some forks.
        }

        return "--";
    }

    private void writeJson(HttpExchange exchange, int statusCode, String body) throws IOException {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, payload.length);

        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(payload);
        } finally {
            exchange.close();
        }
    }

    private void safeWriteJson(HttpExchange exchange, int statusCode, String body) {
        try {
            writeJson(exchange, statusCode, body);
        } catch (IOException ignored) {
            // No-op: client may have already disconnected.
        }
    }

    @FunctionalInterface
    private interface MaterialPredicate {
        boolean test(Material material);
    }

    @FunctionalInterface
    private interface CheckedSupplier<T> {
        T get() throws Exception;
    }

    private record StatusSnapshot(
        boolean ok,
        boolean online,
        String host,
        String ip,
        int port,
        String version,
        int playersOnline,
        int playersMax,
        List<String> samplePlayers,
        String motd,
        String tps,
        String updatedAt
    ) {
        private String toJson() {
            return "{"
                + "\"ok\":" + ok + ","
                + "\"online\":" + online + ","
                + "\"host\":\"" + escape(host) + "\","
                + "\"ip\":\"" + escape(ip) + "\","
                + "\"port\":" + port + ","
                + "\"version\":\"" + escape(version) + "\","
                + "\"playersOnline\":" + playersOnline + ","
                + "\"playersMax\":" + playersMax + ","
                + "\"samplePlayers\":" + stringifyArray(samplePlayers) + ","
                + "\"motd\":\"" + escape(motd) + "\","
                + "\"tps\":\"" + escape(tps) + "\","
                + "\"updatedAt\":\"" + escape(updatedAt) + "\""
                + "}";
        }
    }

    private static final class WorldTotals {
        private long playTicks = 0L;
        private long deaths = 0L;
        private long playerKills = 0L;
        private long mobKills = 0L;
        private long blocksBroken = 0L;
        private long blocksPlaced = 0L;
        private long itemsCrafted = 0L;
        private long distanceWalkedCm = 0L;
        private long distanceSwumCm = 0L;
        private long chatMessages = 0L;
        private long achievements = 0L;
        private long uniquePlayers = 0L;

        private String toJson() {
            return "{"
                + "\"playTicks\":" + playTicks + ","
                + "\"deaths\":" + deaths + ","
                + "\"playerKills\":" + playerKills + ","
                + "\"mobKills\":" + mobKills + ","
                + "\"blocksBroken\":" + blocksBroken + ","
                + "\"blocksPlaced\":" + blocksPlaced + ","
                + "\"itemsCrafted\":" + itemsCrafted + ","
                + "\"distanceWalkedCm\":" + distanceWalkedCm + ","
                + "\"distanceSwumCm\":" + distanceSwumCm + ","
                + "\"chatMessages\":" + chatMessages + ","
                + "\"achievements\":" + achievements + ","
                + "\"uniquePlayers\":" + uniquePlayers
                + "}";
        }
    }

    private record PlayerStatsEntry(
        String name,
        boolean online,
        long playTicks,
        long deaths,
        long playerKills,
        long mobKills,
        long blocksBroken,
        long blocksPlaced,
        long distanceWalkedCm,
        long distanceSwumCm
    ) {
        private String toJson() {
            return "{"
                + "\"name\":\"" + escape(name) + "\","
                + "\"online\":" + online + ","
                + "\"playTicks\":" + playTicks + ","
                + "\"deaths\":" + deaths + ","
                + "\"playerKills\":" + playerKills + ","
                + "\"mobKills\":" + mobKills + ","
                + "\"blocksBroken\":" + blocksBroken + ","
                + "\"blocksPlaced\":" + blocksPlaced + ","
                + "\"distanceWalkedCm\":" + distanceWalkedCm + ","
                + "\"distanceSwumCm\":" + distanceSwumCm
                + "}";
        }
    }

    private record WorldStatsSnapshot(
        boolean ok,
        WorldTotals totals,
        List<PlayerStatsEntry> leaderboard,
        String updatedAt
    ) {
        private String toJson() {
            StringBuilder builder = new StringBuilder();
            builder.append("{")
                .append("\"ok\":").append(ok).append(",")
                .append("\"totals\":").append(totals.toJson()).append(",")
                .append("\"leaderboard\":[");

            for (int index = 0; index < leaderboard.size(); index++) {
                if (index > 0) {
                    builder.append(",");
                }
                builder.append(leaderboard.get(index).toJson());
            }

            builder.append("],")
                .append("\"updatedAt\":\"").append(escape(updatedAt)).append("\"")
                .append("}");

            return builder.toString();
        }
    }

    private static String stringifyArray(List<String> values) {
        StringBuilder builder = new StringBuilder("[");

        for (int index = 0; index < values.size(); index++) {
            if (index > 0) {
                builder.append(",");
            }
            builder.append("\"").append(escape(values.get(index))).append("\"");
        }

        builder.append("]");
        return builder.toString();
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }

        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "")
            .replace("\n", "\\n");
    }
}

