import WidgetKit
import SwiftUI
import AppIntents
import ImageIO
import CoreGraphics

// MARK: - Data Models

struct WidgetData: Codable {
    var lastEntry: EntryData?
    var watchlist: [WatchlistItem]
    var stats: Stats?
    var recentEntries: [EntryData]

    struct EntryData: Codable {
        let id: Int
        let title: String
        let mediaType: String
        let rating: Double
        let watchedOn: String
        let posterURL: String?
    }

    struct WatchlistItem: Codable {
        let id: Int
        let title: String
        let mediaType: String
        let posterURL: String?
    }

    struct Stats: Codable {
        let totalMovies: Int
        let totalTV: Int
        let totalEntries: Int
        let thisMonth: Int
        let streak: Int
        let avgRating: Double?
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        lastEntry     = try c.decodeIfPresent(EntryData.self,      forKey: .lastEntry)
        watchlist     = (try? c.decode([WatchlistItem].self,        forKey: .watchlist))     ?? []
        stats         = try c.decodeIfPresent(Stats.self,          forKey: .stats)
        recentEntries = (try? c.decode([EntryData].self,           forKey: .recentEntries)) ?? []
    }

    init(lastEntry: EntryData?, watchlist: [WatchlistItem], stats: Stats?, recentEntries: [EntryData]) {
        self.lastEntry     = lastEntry
        self.watchlist     = watchlist
        self.stats         = stats
        self.recentEntries = recentEntries
    }

    static var empty: WidgetData {
        WidgetData(lastEntry: nil, watchlist: [], stats: nil, recentEntries: [])
    }
}

// MARK: - Widget Content Intent

enum WidgetContent: String, AppEnum {
    case lastWatch = "lastWatch"
    case watchlist = "watchlist"
    case stats     = "stats"

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Content")
    static var caseDisplayRepresentations: [WidgetContent: DisplayRepresentation] = [
        .lastWatch: "Last Watch",
        .watchlist: "Watchlist",
        .stats:     "Stats",
    ]
}

struct ReelFeelIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "ReelFeel"
    static var description = IntentDescription("Choose what this widget shows.")

    @Parameter(title: "Show", default: .lastWatch)
    var content: WidgetContent
}

// MARK: - Timeline Entry

struct ReelFeelEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
    let configuration: ReelFeelIntent
    var posterImages: [String: CGImage] = [:]

    func poster(for url: String?) -> CGImage? {
        guard let url else { return nil }
        return posterImages[url]
    }
}

// MARK: - Provider

struct Provider: AppIntentTimelineProvider {
    typealias Entry  = ReelFeelEntry
    typealias Intent = ReelFeelIntent

    let appGroup = "group.com.reelfeel.app"

    func readData() -> WidgetData {
        guard
            let json    = UserDefaults(suiteName: appGroup)?.string(forKey: "widgetData"),
            let raw     = json.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(WidgetData.self, from: raw)
        else { return .empty }
        return decoded
    }

    func preloadImages(from data: WidgetData) async -> [String: CGImage] {
        var urls: Set<String> = []
        if let u = data.lastEntry?.posterURL { urls.insert(u) }
        data.watchlist.compactMap { $0.posterURL }.forEach { urls.insert($0) }
        data.recentEntries.compactMap { $0.posterURL }.prefix(6).forEach { urls.insert($0) }

        var result: [String: CGImage] = [:]
        await withTaskGroup(of: (String, CGImage?).self) { group in
            for urlStr in urls {
                guard let url = URL(string: urlStr) else { continue }
                group.addTask {
                    guard let (imgData, _) = try? await URLSession.shared.data(from: url),
                          let src = CGImageSourceCreateWithData(imgData as CFData, nil),
                          let cg  = CGImageSourceCreateImageAtIndex(src, 0, nil)
                    else { return (urlStr, nil) }
                    return (urlStr, cg)
                }
            }
            for await (key, img) in group {
                if let img { result[key] = img }
            }
        }
        return result
    }

    func placeholder(in context: Context) -> ReelFeelEntry {
        ReelFeelEntry(date: Date(), data: .empty, configuration: ReelFeelIntent())
    }

    func snapshot(for configuration: ReelFeelIntent, in context: Context) async -> ReelFeelEntry {
        let data   = readData()
        let images = await preloadImages(from: data)
        return ReelFeelEntry(date: Date(), data: data, configuration: configuration, posterImages: images)
    }

    func timeline(for configuration: ReelFeelIntent, in context: Context) async -> Timeline<ReelFeelEntry> {
        let data   = readData()
        let images = await preloadImages(from: data)
        let entry  = ReelFeelEntry(date: Date(), data: data, configuration: configuration, posterImages: images)
        let next   = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        return Timeline(entries: [entry], policy: .after(next))
    }
}

// MARK: - Design tokens

private let rfGold = Color(red: 212/255, green: 175/255, blue: 55/255)

struct RFColors {
    let bg:      Color
    let bgCard:  Color
    let border:  Color
    let text:    Color
    let textSub: Color
    let textMut: Color

    static func make(_ scheme: ColorScheme) -> RFColors {
        if scheme == .dark {
            return RFColors(
                bg:      Color(red: 17/255,  green: 17/255,  blue: 17/255),
                bgCard:  Color(red: 30/255,  green: 30/255,  blue: 30/255),
                border:  Color(red: 42/255,  green: 42/255,  blue: 42/255),
                text:    Color.white,
                textSub: Color(red: 163/255, green: 163/255, blue: 163/255),
                textMut: Color(red: 107/255, green: 107/255, blue: 107/255)
            )
        } else {
            return RFColors(
                bg:      Color(red: 250/255, green: 249/255, blue: 245/255),
                bgCard:  Color(red: 238/255, green: 236/255, blue: 230/255),
                border:  Color(red: 210/255, green: 208/255, blue: 200/255),
                text:    Color(red: 15/255,  green: 15/255,  blue: 15/255),
                textSub: Color(red: 60/255,  green: 60/255,  blue: 60/255),
                textMut: Color(red: 120/255, green: 118/255, blue: 112/255)
            )
        }
    }
}

// MARK: - Subviews

struct StarRow: View {
    let rating: Double
    let size: CGFloat
    var body: some View {
        HStack(spacing: 1.5) {
            ForEach(1...5, id: \.self) { i in
                Image(systemName: Double(i) <= rating ? "star.fill" : "star")
                    .font(.system(size: size, weight: .bold))
                    .foregroundColor(rfGold)
            }
        }
    }
}

struct PosterView: View {
    let title: String
    let width: CGFloat
    let height: CGFloat
    var image: CGImage? = nil
    var c: RFColors

    var body: some View {
        Group {
            if let cg = image {
                Image(cg, scale: 1.0, orientation: .up, label: Text(title))
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                c.bgCard.overlay(
                    Text(title.prefix(1).uppercased())
                        .font(.system(size: width * 0.25, weight: .bold))
                        .foregroundColor(c.textMut)
                )
            }
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

struct EmptyState: View {
    let icon: String
    let label: String
    var c: RFColors
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundColor(c.textMut)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(c.textMut)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct StatCell: View {
    let value: String
    let label: String
    var gold: Bool = false
    var c: RFColors
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 15, weight: .black))
                .foregroundColor(gold ? rfGold : c.text)
            Text(label.uppercased())
                .font(.system(size: 7, weight: .bold))
                .foregroundColor(c.textMut)
                .kerning(0.4)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Last Watch views

struct LastWatchSmall: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        if let e = entry.data.lastEntry {
            ZStack(alignment: .bottomLeading) {
                PosterView(title: e.title, width: 170, height: 170, image: entry.poster(for: e.posterURL), c: c)
                LinearGradient(colors: [.clear, Color.black.opacity(0.88)], startPoint: .center, endPoint: .bottom)
                VStack(alignment: .leading, spacing: 4) {
                    StarRow(rating: e.rating, size: 7.5)
                    Text(e.title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                }
                .padding(10)
            }
        } else {
            EmptyState(icon: "film", label: "Log your first watch", c: c)
        }
    }
}

struct LastWatchMedium: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        let recent = entry.data.recentEntries.prefix(3)
        if recent.isEmpty {
            EmptyState(icon: "film", label: "Log your first watch", c: c)
        } else {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("RECENTLY WATCHED")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(rfGold)
                        .kerning(1.2)
                    Spacer()
                    Image(systemName: "heart.fill")
                        .font(.system(size: 10))
                        .foregroundColor(rfGold)
                }
                .padding(.horizontal, 14)
                .padding(.top, 12)
                .padding(.bottom, 10)

                HStack(alignment: .top, spacing: 10) {
                    ForEach(Array(recent.enumerated()), id: \.offset) { _, e in
                        VStack(alignment: .leading, spacing: 5) {
                            PosterView(title: e.title, width: 64, height: 94, image: entry.poster(for: e.posterURL), c: c)
                            Text(e.title)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(c.textSub)
                                .lineLimit(2)
                                .frame(width: 64, alignment: .leading)
                            StarRow(rating: e.rating, size: 6)
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 14)
                Spacer()
            }
        }
    }
}

struct LastWatchLarge: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        let recent = Array(entry.data.recentEntries.prefix(4))
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("RECENTLY WATCHED")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(rfGold)
                    .kerning(1.5)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 12)

            if recent.isEmpty {
                EmptyState(icon: "film", label: "Log your first watch", c: c)
            } else {
                GeometryReader { geo in
                    let posterH = geo.size.height - 28
                    let posterW = posterH * 2 / 3
                    HStack(alignment: .top, spacing: 8) {
                        ForEach(Array(recent.enumerated()), id: \.offset) { _, e in
                            VStack(alignment: .leading, spacing: 4) {
                                PosterView(title: e.title, width: posterW, height: posterH, image: entry.poster(for: e.posterURL), c: c)
                                Text(e.title)
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundColor(c.textSub)
                                    .lineLimit(2)
                                    .frame(width: posterW, alignment: .leading)
                                StarRow(rating: e.rating, size: 5.5)
                            }
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                }
            }
        }
    }
}

// MARK: - Watchlist views

struct WatchlistSmall: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        if let item = entry.data.watchlist.first {
            ZStack(alignment: .bottomLeading) {
                PosterView(title: item.title, width: 170, height: 170, image: entry.poster(for: item.posterURL), c: c)
                LinearGradient(colors: [.clear, Color.black.opacity(0.88)], startPoint: .center, endPoint: .bottom)
                VStack(alignment: .leading, spacing: 2) {
                    Text("UP NEXT")
                        .font(.system(size: 7, weight: .black))
                        .foregroundColor(rfGold)
                        .kerning(1.0)
                    Text(item.title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .lineLimit(2)
                }
                .padding(10)
            }
        } else {
            EmptyState(icon: "bookmark", label: "Your watchlist is empty", c: c)
        }
    }
}

struct WatchlistMedium: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        if entry.data.watchlist.isEmpty {
            EmptyState(icon: "bookmark", label: "Your watchlist is empty", c: c)
        } else {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("UP NEXT")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(rfGold)
                        .kerning(1.2)
                    Spacer()
                    Image(systemName: "bookmark.fill")
                        .font(.system(size: 10))
                        .foregroundColor(rfGold)
                }
                .padding(.horizontal, 14)
                .padding(.top, 12)
                .padding(.bottom, 10)

                HStack(alignment: .top, spacing: 10) {
                    ForEach(Array(entry.data.watchlist.prefix(3).enumerated()), id: \.offset) { _, item in
                        VStack(alignment: .leading, spacing: 5) {
                            PosterView(title: item.title, width: 64, height: 94, image: entry.poster(for: item.posterURL), c: c)
                            Text(item.title)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(c.textSub)
                                .lineLimit(2)
                                .frame(width: 64, alignment: .leading)
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 14)
                Spacer()
            }
        }
    }
}

struct WatchlistLarge: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("WATCHLIST")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(rfGold)
                    .kerning(1.5)
                Spacer()
                Image(systemName: "bookmark.fill")
                    .font(.system(size: 11))
                    .foregroundColor(rfGold)
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 12)

            if entry.data.watchlist.isEmpty {
                EmptyState(icon: "bookmark", label: "Add films to your watchlist", c: c)
            } else {
                GeometryReader { geo in
                    let items = Array(entry.data.watchlist.prefix(4))
                    let posterH = geo.size.height - 28
                    let posterW = posterH * 2 / 3
                    HStack(alignment: .top, spacing: 8) {
                        ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                            VStack(alignment: .leading, spacing: 4) {
                                PosterView(title: item.title, width: posterW, height: posterH, image: entry.poster(for: item.posterURL), c: c)
                                Text(item.title)
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundColor(c.textSub)
                                    .lineLimit(2)
                                    .frame(width: posterW, alignment: .leading)
                            }
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                }
            }
        }
    }
}

// MARK: - Stats views

struct StatsSmall: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        if let s = entry.data.stats {
            VStack(spacing: 8) {
                Text("REELFEEL")
                    .font(.system(size: 8, weight: .black))
                    .foregroundColor(rfGold)
                    .kerning(1.2)
                Text("\(s.totalEntries)")
                    .font(.system(size: 36, weight: .black))
                    .foregroundColor(c.text)
                Text("WATCHED")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(c.textMut)
                    .kerning(0.8)
                if let avg = s.avgRating {
                    Text(String(format: "%.1f★ avg", avg))
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(rfGold)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            EmptyState(icon: "chart.bar.fill", label: "No stats yet", c: c)
        }
    }
}

struct StatsMedium: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("REELFEEL")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(rfGold)
                    .kerning(1.2)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 10)

            if let s = entry.data.stats {
                HStack(spacing: 0) {
                    StatCell(value: "\(s.totalMovies)", label: "Films", c: c)
                    c.border.frame(width: 0.5, height: 28)
                    StatCell(value: "\(s.totalTV)", label: "Shows", c: c)
                    c.border.frame(width: 0.5, height: 28)
                    StatCell(value: "\(s.thisMonth)", label: "This month", c: c)
                    if let avg = s.avgRating {
                        c.border.frame(width: 0.5, height: 28)
                        StatCell(value: String(format: "%.1f★", avg), label: "Avg rating", gold: true, c: c)
                    }
                }
            }
            Spacer()
        }
    }
}

struct StatsLarge: View {
    let entry: ReelFeelEntry
    var c: RFColors
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("REELFEEL")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(rfGold)
                    .kerning(1.5)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 12)

            if let s = entry.data.stats {
                HStack(spacing: 0) {
                    StatCell(value: "\(s.totalMovies)", label: "Films", c: c)
                    c.border.frame(width: 0.5, height: 28)
                    StatCell(value: "\(s.totalTV)", label: "Shows", c: c)
                    c.border.frame(width: 0.5, height: 28)
                    StatCell(value: "\(s.thisMonth)", label: "This month", c: c)
                    if let avg = s.avgRating {
                        c.border.frame(width: 0.5, height: 28)
                        StatCell(value: String(format: "%.1f★", avg), label: "Avg rating", gold: true, c: c)
                    }
                }
                .padding(.bottom, 12)
            }

            c.border.frame(height: 0.5).padding(.horizontal, 14)

            Text("WATCHLIST")
                .font(.system(size: 9, weight: .black))
                .foregroundColor(c.textMut)
                .kerning(1.0)
                .padding(.horizontal, 14)
                .padding(.top, 12)
                .padding(.bottom, 8)

            if entry.data.watchlist.isEmpty {
                EmptyState(icon: "bookmark", label: "Add films to your watchlist", c: c)
            } else {
                GeometryReader { geo in
                    let items = Array(entry.data.watchlist.prefix(4))
                    let posterH = geo.size.height - 24
                    let posterW = posterH * 2 / 3
                    HStack(alignment: .top, spacing: 8) {
                        ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                            VStack(alignment: .leading, spacing: 4) {
                                PosterView(title: item.title, width: posterW, height: posterH, image: entry.poster(for: item.posterURL), c: c)
                                Text(item.title)
                                    .font(.system(size: 8, weight: .semibold))
                                    .foregroundColor(c.textSub)
                                    .lineLimit(2)
                                    .frame(width: posterW, alignment: .leading)
                            }
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                }
            }
        }
    }
}

// MARK: - Widget Entry View

struct ReelFeelWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var scheme
    var entry: ReelFeelEntry

    var body: some View {
        let c = RFColors.make(scheme)
        switch entry.configuration.content {
        case .lastWatch:
            switch family {
            case .systemSmall:
                LastWatchSmall(entry: entry, c: c)
                    .containerBackground(scheme == .dark ? Color(red: 0, green: 0, blue: 0) : Color(red: 250/255, green: 249/255, blue: 245/255), for: .widget)
            case .systemMedium:
                LastWatchMedium(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            default:
                LastWatchLarge(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            }
        case .watchlist:
            switch family {
            case .systemSmall:
                WatchlistSmall(entry: entry, c: c)
                    .containerBackground(scheme == .dark ? Color(red: 0, green: 0, blue: 0) : Color(red: 250/255, green: 249/255, blue: 245/255), for: .widget)
            case .systemMedium:
                WatchlistMedium(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            default:
                WatchlistLarge(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            }
        case .stats:
            switch family {
            case .systemSmall:
                StatsSmall(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            case .systemMedium:
                StatsMedium(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            default:
                StatsLarge(entry: entry, c: c)
                    .containerBackground(c.bg, for: .widget)
            }
        }
    }
}

// MARK: - Widget

struct ReelFeelWidget: Widget {
    let kind = "ReelFeelWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ReelFeelIntent.self, provider: Provider()) { entry in
            ReelFeelWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("ReelFeel")
        .description("Your watch diary at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
