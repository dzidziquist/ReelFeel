import WidgetKit
import SwiftUI

// MARK: - Data Models

struct WidgetData: Codable {
    var lastEntry: EntryData?
    var watchlist: [WatchlistItem]
    var stats: Stats?

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

    static var empty: WidgetData {
        WidgetData(lastEntry: nil, watchlist: [], stats: nil)
    }
}

// MARK: - Timeline Entry

struct ReelFeelEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Provider

struct Provider: TimelineProvider {
    let appGroup = "group.com.reelfeel.app"

    func readData() -> WidgetData {
        guard
            let json = UserDefaults(suiteName: appGroup)?.string(forKey: "widgetData"),
            let raw = json.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(WidgetData.self, from: raw)
        else { return .empty }
        return decoded
    }

    func placeholder(in context: Context) -> ReelFeelEntry {
        ReelFeelEntry(date: Date(), data: .empty)
    }

    func getSnapshot(in context: Context, completion: @escaping (ReelFeelEntry) -> Void) {
        completion(ReelFeelEntry(date: Date(), data: readData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ReelFeelEntry>) -> Void) {
        let entry = ReelFeelEntry(date: Date(), data: readData())
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - iOS 16/17 compatibility

private extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            background(color)
        }
    }
}

// MARK: - Design tokens

private extension Color {
    static let rfBg      = Color(red: 17/255,  green: 17/255,  blue: 17/255)
    static let rfBgDark  = Color(red: 0,        green: 0,        blue: 0)
    static let rfBg3     = Color(red: 44/255,  green: 44/255,  blue: 46/255)
    static let rfGold    = Color(red: 212/255, green: 175/255, blue: 55/255)
    static let rfText    = Color.white
    static let rfTextSub = Color(red: 163/255, green: 163/255, blue: 163/255)
    static let rfTextMut = Color(red: 107/255, green: 107/255, blue: 107/255)
    static let rfBorder  = Color(red: 42/255,  green: 42/255,  blue: 42/255)
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
                    .foregroundColor(.rfGold)
            }
        }
    }
}

struct PosterView: View {
    let url: String?
    let title: String
    let width: CGFloat
    let height: CGFloat

    var body: some View {
        AsyncImage(url: url.flatMap { URL(string: $0) }) { phase in
            if let image = phase.image {
                image.resizable().aspectRatio(contentMode: .fill)
            } else {
                Color.rfBg3.overlay(
                    Text(title.prefix(1).uppercased())
                        .font(.system(size: width * 0.25, weight: .bold))
                        .foregroundColor(.rfTextMut)
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
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundColor(.rfTextMut)
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.rfTextMut)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Small (last entry)

struct SmallView: View {
    let entry: ReelFeelEntry
    var body: some View {
        if let e = entry.data.lastEntry {
            ZStack(alignment: .bottomLeading) {
                PosterView(url: e.posterURL, title: e.title, width: 170, height: 170)
                LinearGradient(
                    colors: [.clear, Color.black.opacity(0.88)],
                    startPoint: .center, endPoint: .bottom
                )
                VStack(alignment: .leading, spacing: 4) {
                    StarRow(rating: e.rating, size: 7.5)
                    Text(e.title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.rfText)
                        .lineLimit(2)
                }
                .padding(10)
            }
        } else {
            EmptyState(icon: "film", label: "Log your first watch")
        }
    }
}

// MARK: - Medium (watchlist)

struct MediumView: View {
    let entry: ReelFeelEntry
    var body: some View {
        if entry.data.watchlist.isEmpty {
            EmptyState(icon: "bookmark", label: "Your watchlist is empty")
        } else {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("UP NEXT")
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.rfGold)
                        .kerning(1.2)
                    Spacer()
                    Image(systemName: "bookmark.fill")
                        .font(.system(size: 10))
                        .foregroundColor(.rfGold)
                }
                .padding(.horizontal, 14)
                .padding(.top, 12)
                .padding(.bottom, 10)

                HStack(alignment: .top, spacing: 10) {
                    ForEach(Array(entry.data.watchlist.prefix(3).enumerated()), id: \.offset) { _, item in
                        VStack(alignment: .leading, spacing: 5) {
                            PosterView(url: item.posterURL, title: item.title, width: 64, height: 94)
                            Text(item.title)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(.rfTextSub)
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

// MARK: - Large (stats + watchlist grid)

struct LargeView: View {
    let entry: ReelFeelEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("REELFEEL")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(.rfGold)
                    .kerning(1.5)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 12)

            if let s = entry.data.stats {
                HStack(spacing: 0) {
                    StatCell(value: "\(s.totalMovies)", label: "Films")
                    Color.rfBorder.frame(width: 0.5, height: 28)
                    StatCell(value: "\(s.totalTV)", label: "Shows")
                    Color.rfBorder.frame(width: 0.5, height: 28)
                    StatCell(value: "\(s.thisMonth)", label: "This month")
                    if let avg = s.avgRating {
                        Color.rfBorder.frame(width: 0.5, height: 28)
                        StatCell(value: String(format: "%.1f★", avg), label: "Avg rating", gold: true)
                    }
                }
                .padding(.bottom, 12)
            }

            Color.rfBorder.frame(height: 0.5).padding(.horizontal, 14)

            if !entry.data.watchlist.isEmpty {
                Text("WATCHLIST")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(.rfTextMut)
                    .kerning(1.0)
                    .padding(.horizontal, 14)
                    .padding(.top, 12)
                    .padding(.bottom, 8)

                HStack(alignment: .top, spacing: 8) {
                    ForEach(Array(entry.data.watchlist.prefix(4).enumerated()), id: \.offset) { _, item in
                        VStack(alignment: .leading, spacing: 4) {
                            PosterView(url: item.posterURL, title: item.title, width: 58, height: 84)
                            Text(item.title)
                                .font(.system(size: 8, weight: .semibold))
                                .foregroundColor(.rfTextSub)
                                .lineLimit(2)
                                .frame(width: 58, alignment: .leading)
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 14)
            } else {
                EmptyState(icon: "bookmark", label: "Add films to your watchlist")
            }

            Spacer()
        }
    }
}

struct StatCell: View {
    let value: String
    let label: String
    var gold: Bool = false
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 15, weight: .black))
                .foregroundColor(gold ? .rfGold : .rfText)
            Text(label.uppercased())
                .font(.system(size: 7, weight: .bold))
                .foregroundColor(.rfTextMut)
                .kerning(0.4)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Widget Entry View

struct ReelFeelWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: ReelFeelEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallView(entry: entry)
        case .systemMedium:
            MediumView(entry: entry)
                .background(Color.rfBg)
        case .systemLarge:
            LargeView(entry: entry)
                .background(Color.rfBg)
        default:
            EmptyState(icon: "film", label: "")
        }
    }
}

// MARK: - Widget

struct ReelFeelWidget: Widget {
    let kind = "ReelFeelWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ReelFeelWidgetEntryView(entry: entry)
                .widgetBackground(Color.rfBgDark)
        }
        .configurationDisplayName("ReelFeel")
        .description("Your watch diary at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
