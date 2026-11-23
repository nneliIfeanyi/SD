export function chooseDefaultEvent(events, now = new Date()) {
    if (!events.length) return null;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const activeEvent = events.find(event => event.start_date <= today && event.end_date >= today);
    if (activeEvent) return activeEvent;

    const upcomingEvents = events
        .filter(event => event.start_date > today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return upcomingEvents[0] || events[0];
}
