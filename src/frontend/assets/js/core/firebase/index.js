import { auth, db, app } from "./config.js";
import UserService from "./services/userservice/UserService.js";
import EventService from "./services/eventService/EventService.js";
import ConversationService from "./services/ConversationService.js";
import SettingsService from "./services/settingsService/SettingsService.js";
import CalendarAI from "./services/AI/CalendarAI.js";
import { onAuthStateChanged } from "./firebase-exports.js";

export {
    auth,
    db,
    app,
    UserService,
    EventService,
    ConversationService,
    SettingsService,
    CalendarAI,
    onAuthStateChanged
};
