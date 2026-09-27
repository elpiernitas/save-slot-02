# GAME-05 — Test Matrix

Status: prepared, blocked until GAME-04R visual ACCEPT.

## Pure inventory

- create empty inventory
- give unique item
- give stackable item
- clamp at maxStack
- preserve first acquiredAt
- take partial quantity
- take to zero deletes record
- take missing item is no-op
- quantity <= 0 rejected/normalised according to implementation contract
- unknown item id detected by validation

## Pure cards

- first give creates owned card
- count = 1
- seen = false
- duplicate give is no-op
- obtainedAt preserved
- mark seen
- mark seen missing card is no-op
- secret definition does not leak into owned state before acquisition

## Reducer

- item/give touches timestamps only on state change
- item/take touches timestamps only on state change
- card/give touches timestamps only on first acquisition
- card/markSeen touches timestamps on change
- save version remains 2 if JSON shape unchanged

## Conditions

- hasItem false at zero/missing
- hasItem default min=1
- hasItem custom min
- hasCard, only if implemented

## Dialogue effects

- giveItem maps to command
- takeItem maps to command
- giveCard maps to command
- these are removed from UNSUPPORTED_EFFECTS
- createRecordingHost sees item state after giveItem
- branch immediately after acquisition works
- duplicate card grant remains deterministic

## Content validation

Items:
- unique ids
- positive maxStack
- category valid
- descriptions non-empty
- referenced icons exist or are explicit placeholders

Cards:
- unique ids
- unique normal numbers
- valid kind
- valid rarity
- flavour <= target length
- secret cards hiddenUntilOwned
- art refs exist or explicit placeholder
- no third-party IP identifiers in first set

## Inventory UI

- empty state
- first selection
- keyboard wraps or clamps consistently
- mouse selection
- description matches selected item
- quantity hidden at 1 / visible above 1
- Escape closes
- world does not move underneath
- resting pointer does not steal keyboard selection

## Binder UI

- no cards empty state
- owned cards rendered
- NEW badge for unseen
- open detail marks seen
- seen persists after rerender
- secret unavailable before owned
- keyboard grid navigation
- mouse
- Escape detail then binder
- reduced motion

## Acquisition overlay

- item overlay blocks world input
- card overlay blocks world input
- confirm closes once
- held Enter does not instantly close + interact
- reduced motion
- no scroll

## Persistence

- acquire item → refresh → item remains
- acquire card → refresh → card remains unseen until inspected
- inspect card → refresh → seen remains true
- checkpoint unaffected by opening panels

## Browser QA

1920×1080:
- keyboard acquisition + panels

1440×900:
- mouse path

1366×768:
- readability and no overflow

All:
- console clean
- no body scroll
- world pauses
- world resumes
- dialogue still works after closing panel
