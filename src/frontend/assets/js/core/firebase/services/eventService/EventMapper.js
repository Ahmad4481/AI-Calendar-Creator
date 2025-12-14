// ----------------------
// EventMapper
// - Maps data to event object
// ----------------------
import { serverTimestamp, Timestamp } from "../../firebase-exports.js";

export default function eventMapper(data = {}) {
    const {
        title = "",
        description = "",
        startTime = null,
        endTime = null,
        rrule = null,
        completed = false,
        recurring = false,
        exdates = [],
        priority = "",
        extra = {}
    } = data;

    // Convert start/end to Timestamp if they are strings
    let finalStartTime = startTime || null;
    let finalEndTime = endTime || null;

    // Convert string dates to Timestamps
    if (finalStartTime && typeof finalStartTime === 'string') {
        try {
            finalStartTime = Timestamp.fromDate(new Date(finalStartTime));
        } catch (e) {
            console.warn('Failed to parse start time:', finalStartTime);
        }
    }
    
    if (finalEndTime && typeof finalEndTime === 'string') {
        try {
            finalEndTime = Timestamp.fromDate(new Date(finalEndTime));
        } catch (e) {
            console.warn('Failed to parse end time:', finalEndTime);
        }
    }

    return {
        title,
        description,
        startTime: finalStartTime,
        endTime: finalEndTime,
        rrule,
        completed,
        priority,
        extra,
        recurring,
        exdates,
    };
};
