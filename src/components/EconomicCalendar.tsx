import { useEffect, useState } from 'react';
import { Calendar, Clock, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

interface GroupedEvents {
  [date: string]: EconomicEvent[];
}

export function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEconomicEvents();
  }, []);

  const fetchEconomicEvents = async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-economic-calendar`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setEvents(result.events);
      } else {
        console.error('Failed to fetch economic calendar');
      }
    } catch (error) {
      console.error('Error fetching economic calendar:', error);
    }
    setLoading(false);
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isToday = now.toDateString() === event.toDateString();
    const isPast = diffTime < 0;

    if (isPast) {
      return { status: 'Completed', days: 0, color: 'text-gray-500', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30' };
    } else if (isToday) {
      return { status: 'Today', days: 0, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10', borderColor: 'border-[#D4AF37]/50' };
    } else if (diffDays === 1) {
      return { status: 'Tomorrow', days: 1, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
    } else {
      return { status: 'Pending', days: diffDays, color: 'text-gray-300', bgColor: 'bg-slate-700/20', borderColor: 'border-slate-600/30' };
    }
  };

  const getImpactConfig = (impact: string) => {
    switch (impact) {
      case 'high':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'High Impact'
        };
      case 'medium':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/50',
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Medium Impact'
        };
      case 'low':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/50',
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Low Impact'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/50',
          icon: <TrendingUp className="w-4 h-4" />,
          label: 'Unknown'
        };
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupEventsByDate = (events: EconomicEvent[]): GroupedEvents => {
    const grouped: GroupedEvents = {};
    events.forEach((event) => {
      const dateKey = new Date(event.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const getDayLabel = (dateKey: string) => {
    const now = new Date();
    const eventDate = new Date(dateKey);
    const today = now.toDateString();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (dateKey === today) return 'Today';
    if (dateKey === tomorrow) return 'Tomorrow';
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDayStatusColor = (dateKey: string) => {
    const now = new Date();
    const eventDate = new Date(dateKey);
    const today = now.toDateString();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    if (dateKey === today) {
      return 'border-[#D4AF37]/50 bg-[#D4AF37]/5';
    }
    if (dateKey === tomorrow) {
      return 'border-blue-500/30 bg-blue-500/5';
    }
    if (eventDate < now) {
      return 'border-gray-700/50 bg-gray-900/20';
    }
    return 'border-slate-700/50 bg-[#0F172A]';
  };

  const getHighestImpact = (events: EconomicEvent[]) => {
    if (events.some(e => e.impact === 'high')) return 'high';
    if (events.some(e => e.impact === 'medium')) return 'medium';
    return 'low';
  };

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={fetchEconomicEvents}
          className="text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition flex items-center gap-2 ml-auto"
        >
          <Clock className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading economic events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No upcoming economic events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateKey) => {
            const dayEvents = groupedEvents[dateKey];
            const isExpanded = expandedDates.has(dateKey);
            const highestImpact = getHighestImpact(dayEvents);
            const impactConfig = getImpactConfig(highestImpact);

            return (
              <div
                key={dateKey}
                className={`rounded-lg border overflow-hidden transition-all duration-300 ${getDayStatusColor(dateKey)}`}
              >
                <button
                  onClick={() => toggleDateExpansion(dateKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#D4AF37]" />
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-lg">
                          {getDayLabel(dateKey)}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${impactConfig.bgColor} ${impactConfig.borderColor}`}>
                      <span className={impactConfig.color}>{impactConfig.icon}</span>
                      <span className={`text-xs font-semibold ${impactConfig.color}`}>
                        {impactConfig.label.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-700/50 bg-[#0F172A]/50">
                    <div className="p-4 space-y-3">
                      {dayEvents
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((event) => {
                          const impact = getImpactConfig(event.impact);
                          return (
                            <div
                              key={event.id}
                              className="bg-[#0F172A] rounded-lg p-4 border border-slate-700/50 hover:border-[#D4AF37]/30 transition-all duration-300"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-8 h-6 rounded overflow-hidden border border-slate-600/50 flex items-center justify-center bg-slate-800">
                                        <span className="text-xs font-bold text-white">
                                          {event.currency}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-white font-semibold text-base">
                                        {event.title}
                                      </h4>
                                      <p className="text-sm text-gray-400 mt-1">{event.country}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <div className="flex items-center gap-1.5 text-gray-300">
                                      <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">{formatEventTime(event.date)}</span>
                                    </div>

                                    {event.forecast && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded">
                                        <span className="text-gray-400">Forecast:</span>
                                        <span className="text-white font-medium">{event.forecast}</span>
                                      </div>
                                    )}

                                    {event.previous && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded">
                                        <span className="text-gray-400">Previous:</span>
                                        <span className="text-gray-300">{event.previous}</span>
                                      </div>
                                    )}

                                    {event.actual && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">
                                        <span className="text-gray-400">Actual:</span>
                                        <span className="text-[#D4AF37] font-medium">{event.actual}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end">
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${impact.bgColor} ${impact.borderColor}`}>
                                    <span className={impact.color}>{impact.icon}</span>
                                    <span className={`text-xs font-semibold ${impact.color}`}>
                                      {impact.label.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
