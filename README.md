## TRUYENCUABAN

This project is designed to create an interactive web-based story reading experience. The goal is to create a platform for users to read stories and receive feedback on their progress.

It will feature an interactive story page. The story page will feature text, images to tell a story. User can create your story to share with the other. If there stories have a high view, they will be payed for that.

## Story Collection

- []: Story titles, cover, authors, genres, summaries, createdAt.
- []: Story is separated by chapters.

### A user can be author of many stories (one to many)

## Chapter collection

- []: number of Chapters, chapter's name, content.
- Story's content: text, image.

### A story can have many chapter (one to many)

## Comment collection

- []: Comment content (text, image).

### Comment and Chapter: a comment come with a chapter (one to many)

### Comment and User: A user can make many comment (one to many)

## Collection User:

\*\*\* Reader

- []: Account: User has name, email, password, avatar (optinal).
- []: User story: Total viewed, liked, shared stories.
- []: User can see liked, shared stories.

\*\*\* Writer

- []: Account: Writer has name, email, password, avatar (optinal).
- []: User story: Total written, viewed, liked, shared stories.
- []: User can see liked, shared stories.

\*\*\*\* User can create new account. After register an account, User can update Account Name, Cover, Gender, Address, Date of Birth, Phone number, ... User need a purchase to be a writter.

## Subcription:

- []: Register time, Expired.
- []: Payment method (optional)

### A user can be subcribe or not (one to one)

## ROUTE

### Authentication

\*\* Login with account

- @route POST /auth/login
- @description Log in with username and password
- @body {email, passsword}
- @access Public
  \*/

### User

\*\* Create new account

- @route POST /users
- @description Register new user
- @body {name, email, password}
- @access Public
  \*/

\*\* Get all users (For admin)

- @route GET /users/page=1?&limit=10
- @description Get user with pagination
- @body
- @access Login required
  \*/

\*\* Get a user (For admin)

- @route GET /users/:id
- @description Get user profile
- @body
- @access Login required
  \*/

\*\*

- @route GET /users/me
- @description Get current user info
- @body
- @access Login required
  \*/

\*\*

- @route PUT /users/:id
- @description Update user profile
- @body {Account Name, Cover, Gender, Address, Date of Birth, Phone number, ID}
- @access Login required
  \*/

### Story

\*\*

- @route GET /stories/:genre?page=1&limit=10
- @description Get all stories by genre with pagination
- @body
- @access Public access
  \*/

\*\*

- @route GET /stories/:id
- @description Get a single story
- @body
- @access Public access
  \*/

\*\* Get comments outside the story

- @route GET /stories/:id/comments
- @description Get comments of a story
- @body
- @access Public access
  \*/

\*\* Create story (For writter)

- @route POST /stories
- @description Create a new story
- @body {titles, cover, authors, genres, summaries}
- @access Login reuqired
  \*/

\*\* (Cannot update content here) (For writter)

- @route PUT /stories/:id
- - @description Update a story
- @body {titles, cover, authors, genres, summaries}
- @access Login required
  \*/

  \*\* (For writter)

- @route DELETE /stories/:id
- @description Delete a story
- @body
- @access Login required

### Chapter

\*\*

- @route GET /stories/chapters?page=1&limit=10
- @description Get all chapters of a story with pagination
- @body
- @access Public access
  \*/

\*\*

- @route GET /stories/chapters/:id
- @description Get a single chapter
- @body
- @access Public access
  \*/

\*\* Comments inside a chapter

- @route GET /stories/chapters/:id/comments
- @description Get comments of a chapter
- @body
- @access Public access
  \*/

\*\* Create chapters (For writter)

- @route POST /stories/:id
- @description Create a new chapter of a story
- @body {NO. of Chapter, chapter's name, content}
- @access Login reuqired
  \*/

\*\* (For writter)

- @route PUT /:id?chapter=1
- @description Update a chapter of a story
- @body { chapter's name, content}
- @access Login required
  \*/

\*\* (For writter)

- @route DELETE /stories/:id?chapter=1
- @description Delete a chapter of a story
- @body
- @access Login required

### Comment

\*\* Create comment

- @route POST /comments
- @description Create a new comment
- @body {targetType: 'Story' or 'Chapter', targetId, content}
- @access Login required
  \*/

\*\* Update comment

- @route PUT /comment:id
- @description Update a comment
- @body
- @access Login required
  \*/

\*\* Delete comment

- @route DELETE comments/:id
- @description Delete a comment
- @body
- @access Login required

### Subscription

\*\* Register subscription to be writter

- @route POST subscriptions/user/:id
- @description Register new subscription
- @body {duration : [30days, 90days, 180days, 365days]}
- @access Login required
  \*/

\*\* GET subscription of a user

- @route GET subscriptions/user/:id
- @description Get subscription of a user
- @body
- @access Login required
  \*/

\*\* Update subscription of a user

- @route PUT subscriptions/user/:id
- @description Update subscription of a user
- @body {duration : + [30days, 90days, 180days, 365days]}
- @access Login required
  \*/

\*\* Not extend subscription of a user

- @route DELETE subscriptions/user/:id
- @description Delete subscription of a user
- @body
- @access Login required

## Entity Relationship Diagram

![](https://i.imgur.com/O7WDblx.png)
