# Pre-Match Messaging Implementation

## Overview

Implemented asymmetric matching and pre-match messaging system where:

- **Users** can see all **Listeners** and send one pre-match message
- **Listeners** only see **Users** who have already right-swiped them, along with their pre-match message
- Chat is only fully enabled after both users have matched (mutual right-swipe)

## Backend Changes

### 1. Profile Model (`backend/src/models/profile.model.js`)

**Added:**

- `preMatchMessage` field (String, nullable) to store pre-match messages

### 2. Profile Controller (`backend/src/controllers/profiles.controller.js`)

**Updated `fetchProfiles`:**

- **For Users (userType = "User"):** Shows all Listeners (normal behavior)
- **For Listeners (userType = "Listener"):** Only shows Users who have accepted them
  - Queries Profile collection where `otherUserId = currentListener` and `Status = "accepted"`
  - Attaches pre-match message to each profile card

**Updated `acceptProfile`:**

- Now accepts `preMatchMessage` parameter from request body
- Only stores pre-match message when User swipes right on Listener
- Validates userTypes before saving message

### 3. Chat Controller (`backend/src/controllers/chat.controller.js`)

**Updated `getChatHistory`:**

- Added special handling for pending matches
- If User has accepted Listener but no mutual match exists:
  - Returns `isPending: true`
  - Returns message: "The listener has not yet accepted the chat invite"
  - Returns empty messages array
- Full chat history only available after mutual match

## Frontend Changes

### 1. Home Screen (`app/(tabs)/index.tsx`)

**New Features:**

- Fetches current user type on mount
- **For Users viewing Listeners:**
  - Shows "Send Message" button on profile cards
  - Opens modal to compose pre-match message
  - Message sent with right-swipe action
- **For Listeners viewing Users:**
  - Shows pre-match message from User on profile card
  - Highlighted with special styling

**New Components:**

- Message modal with:
  - Text input (200 char limit)
  - Character counter
  - "Send & Like" button (swipes right automatically)
  - Cancel button

**New Styles:**

- `preMessageContainer`, `preMessageLabel`, `preMessageText`
- `chatButton`, `chatButtonText`
- Modal styles: `modalOverlay`, `modalContent`, `modalTitle`, etc.

### 2. Chat Context (`components/contexts/chatContext.tsx`)

**Added State:**

- `isPending` - Boolean indicating if match is pending
- `pendingMessage` - Message to display when pending

**Updated `loadChatHistory`:**

- Parses `isPending` and `message` from API response
- Updates context state for ChatScreen to consume

### 3. Chat Screen (`app/ChatScreen.tsx`)

**Updated UI:**

- Shows pending state screen when `isPending = true`
  - Clock icon
  - "Waiting for Response" title
  - Pending message from API
- Input and send button disabled when pending
- Placeholder text changes to "Chat is pending..."

**New Styles:**

- `pendingContainer`, `pendingTitle`, `pendingMessage`

## User Flow

### Scenario 1: User Swipes Right on Listener (With Message)

1. **User** views **Listener's** profile card
2. **User** clicks "Send Message" button
3. Modal opens for message composition
4. **User** types message and clicks "Send & Like"
5. API call to `/api/v1/users/accept` with:
   ```json
   {
     "otherUserId": "listenerId",
     "preMatchMessage": "Hey, would love to chat!"
   }
   ```
6. Profile record created with Status: "accepted" and message stored
7. Card automatically swipes right

### Scenario 2: Listener Sees User's Profile

1. **Listener** opens app and fetches profiles
2. Backend finds all Users who have accepted this Listener
3. Each User's profile includes their `preMatchMessage`
4. **Listener** sees:
   - User's name and details
   - Pre-match message in highlighted box
   - Can swipe left (reject) or right (accept)

### Scenario 3: User Tries to Chat Before Match

1. **User** right-swipes **Listener**
2. **User** goes to Chats tab (Listener won't appear in matches yet)
3. If User manually navigates to chat (e.g., via deep link):
   - API returns `isPending: true`
   - ChatScreen shows:
     - Clock icon
     - "Waiting for Response"
     - "The listener has not yet accepted the chat invite"
   - Input disabled

### Scenario 4: Mutual Match Completed

1. **Listener** swipes right on **User**
2. Both now have Profile records with Status: "accepted"
3. `getMatches` API returns them as mutual matches
4. Both appear in each other's Chats tab
5. Full chat functionality enabled
6. Real-time messaging via Socket.io works

## API Endpoints

### Modified Endpoints

**POST `/api/v1/users/accept`**

```json
{
  "otherUserId": "string",
  "preMatchMessage": "string" // Optional, only for User → Listener
}
```

**GET `/api/v1/users/profiles`**

- Response includes `preMatchMessage` for Listeners viewing Users

**GET `/api/v1/users/history/:otherUserId`**

- Response includes:

```json
{
  "messages": [],
  "isPending": boolean,
  "message": "string" // Only when isPending = true
}
```

## Database Schema

### Profile Collection

```javascript
{
  userId: ObjectId,        // Who performed the action
  otherUserId: ObjectId,   // Target of the action
  Status: "accepted" | "rejected",
  preMatchMessage: String, // Nullable, only for User → Listener
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Checklist

- [ ] User can send pre-match message to Listener
- [ ] Listener sees message on User's profile card
- [ ] User sees pending state in ChatScreen before Listener accepts
- [ ] Listener doesn't see any profiles if no Users have swiped right
- [ ] After mutual match, full chat works
- [ ] Pre-match message limited to 200 characters
- [ ] Modal can be cancelled without swiping
- [ ] "Send & Like" automatically swipes right
- [ ] Listener can swipe left (reject) even after seeing message
- [ ] Socket.io still requires mutual match for real-time messaging

## Security Considerations

- ✅ Pre-match messages only sent when User swipes on Listener (validated by userType)
- ✅ Chat history endpoint checks for pending state before returning 403
- ✅ Socket.io `verifyMatch` still requires mutual acceptance
- ✅ Pre-match message stored in Profile, not Message model (prevents spam)
- ✅ 200 character limit on frontend, should add backend validation
- ⚠️ TODO: Add rate limiting for profile swipes
- ⚠️ TODO: Add backend validation for preMatchMessage length

## Known Limitations

1. Only one pre-match message per match attempt
2. If User swipes left then right again, previous message is overwritten
3. No notification system for Listeners when they receive new messages
4. Pre-match messages not moderated (consider adding content filters)

## Future Enhancements

- [ ] Push notifications when Listener receives message
- [ ] Message editing/deletion before Listener sees it
- [ ] Rich media support (images, voice notes)
- [ ] Message read receipts for pre-match messages
- [ ] Analytics on match rates with vs without messages
- [ ] AI content moderation for pre-match messages
