# Documentation

## Commands

The script does not care or control what the main command trigger is (currently `!task`), but this list of subcommands is baked into the script

### add
- Adds a new task for you to do
- `!task add Something I have to do`

### edit
- Edits your existing task in place, if it's marked as done it stays done
- `!task edit Something I need to do`

### done
- Marks your existing task as finished
- `!task done`

### undo
- Marks your existing task as not finished
- `!task undo`

### remove
- Removes your task
- `!task remove`

### clearAll
- Clears all tasks
- `!task clearAll`

### clearUser
- Removes a given user's task
- `!task clearUser thefrankfreeman`

## User Stories

These are in the format `Given [some context], When [an action], Then [expected outcome]`

Some parts of some user stories require some config in the firebot trigger, for example the script does not check for permissions

### add
- With no existing task
    - Given I am any user in chat with no task in the task list
    - When I send the message `!task add My task`
    - Then an unfinished task called `My task` should be added to the task list with my username, and I should be told in chat that my task has been added
- With an existing task
    - Given I am any user in chat with a task in the task list
    - When I send the message `!task add New task`
    - Then my existing task should be removed and an unfinished task called `New task` should be added to the task list with my username, and I should be told in chat that my task has been added
- An empty message
    - Given I am a user in chat
    - When I send the message `!task add`
    - Then an unfinished task with no title should be added to the task list with my username, and I should be told in chat that my task has been added

### edit
- With no existing task
    - Given I am any user in chat with no task in the task list
    - When I send the message `!task edit New task description`
    - Then it should revert to the full behavior of adding a new task
- With an existing task
    - Given I am any user in chat with a task in the task list
    - When I send the message `!task edit New task description`
    - Then the title of my existing task should change to `New task description`, the finished state should remain, and I should be told in chat that my task has been changed
- An empty message
    - Given I am a user in chat
    - When I send the message `!task edit`
    - Then the title of my existing task should become empty, the finished state should remain, and I should be told in chat that my task has been changed

### done
- With no existing task
    - Given I am any user in chat with no task in the task list
    - When I send the message `!task done`
    - Then I should be told in chat that I have no task and nothing should change in the task list
- With an existing task
    - Given I am any user in chat with a task in the task list
    - When I send the message `!task done`
    - Then my task should be marked as finished, and I should be told in chat that my task is now complete

### undo
- With no existing task
    - Given I am any user in chat with no task in the task list
    - When I send the message `!task undo`
    - Then I should be told that I have no task and nothing should change in the task list
- With an existing task
    - Given I am any user in chat with a task in the task list
    - When I send the message `!task undo`
    - Then my task should be marked as not finished, and I should be told in chat that I am back at my task

### remove
- With no existing task
    - Given I am any user in chat with no task in the task list
    - When I send the message `!task remove`
    - Then I should be told in chat that I have no task and nothing should change in the task list
- With an existing task
    - Given I am any user in chat with a task in the task list
    - When I send the message `!task remove`
    - Then my task should be removed from the task list, and I should be told in chat that my task has been removed

### clearAll
- Permissions
    - Given I am a moderator or the broadcaster in chat
    - When I send the message `!task clearAll`
    - Then all tasks should be removed from the task list, and nothing should appear in chat
- No Permissions
    - Given I am not a moderator or broadcaster in chat
    - When I send the message `!task clearAll`
    - Then I should be told in chat that I cannot do that, and nothing should change in the task list

### clearUser
- Permissions
    - Given I am a moderator or the broadcaster in chat
    - When I send the message `!task clearUser username`
    - Then the task of the given username should be removed from the task list, and I should be told in chat that the user's task has been removed
- Mention
    - Given I am a moderator or the broadcaster in chat
    - When I send the message `!task clearUser @username`
    - Then the task of the given username should be removed from the task list, and I should be told in chat that the user's task has been removed
- No username
    - Given I am a moderator or the broadcaster in chat
    - When I send the message `!task clearUser`
    - Then nothing should change in the task list, and nothing should appear in chat
- No Permissions
    - Given I am not a moderator or broadcaster in chat
    - When I send the message `!task clearUser`
    - Then I should be told in chat that I cannot do that, and nothing should change in the task list

### Catch-all
- Extra text
    - Given I am a user in chat and I send a task command message that does not need any extra text (`done`, `undo`, `remove`, `clearAll`)
    - When I include extra text after the command (`!task done My task`)
    - Then the extra text should have no effect on what happens
