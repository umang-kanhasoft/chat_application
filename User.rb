User
id
name
email
role (CLIENT, FREELANCER, BOTH)

Skills 
id
name

UserSkills
userId
skillId
yearsofexperience
level

Projects
id
title
description
status (OPEN, IN_PROGRESS, COMPLETED, CANCELLED)
clientId (userId)
acceptedBid

ProjectSkills
projectId
skillId

Bids
id
amount
status (PENDING, REJECTED, ACCEPTED)
message (messageId)
userId
projectId

Messages
id
content
senderId
receiverId
projectId
