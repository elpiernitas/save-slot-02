# SAVE SLOT 02 — Original OST Direction

Status: composition direction for GAME-11.

## Rule

Original only.

Shared playlists are mood references, not composition sources.

Do not reproduce melodies, rhythms or arrangements from commercial tracks.

## Motif

Use a small original 5-note cell.

Suggested scale family:
- Dorian / major-pentatonic-adjacent;
- warm, slightly nostalgic;
- avoid obvious game-theme quotation.

Exact notes should be authored/tested in code and documented once chosen.

## Track personalities

### SYSTEM
Tempo: slow.
Sound:
- triangle bass;
- sparse square/soft sine pulse;
- high terminal ping.

Feeling:
booting something private/strange.

### LA MURALLA · TARDE
Tempo: medium.
Sound:
- triangle/pluck lead;
- soft bass;
- tiny syncopated percussion/noise click.

Feeling:
warm city afternoon, not romantic montage.

### PUZZLE
Same motif chopped into shorter cells.

Feeling:
curious, focused.

### DESYNC
Same harmonic material with displaced rhythm.

Feeling:
system struggling, not scary.

### ENDING
Motif in clean slow form.

Feeling:
quiet payoff.

## Dynamics

Music should sit behind dialogue.

Voice/dialogue > UI SFX > music.

Keep music channel default around current 0.6 or lower after ear QA.

## Loop length

Short web game:
20–45 second loops are acceptable if variation prevents obvious fatigue.

## Implementation

Prefer schedule-ahead Web Audio pattern data.

Represent tracks as data where practical:
- bpm;
- steps;
- notes;
- instruments;
- loop length.

No audio files necessary for P0.
