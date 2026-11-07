---
title: 'Beginning DeltaChroma'
description: 'Kicking off development on the colour palette generator.'
pubDate: 2026-11-01
---

# Beginning DeltaChroma

Welcome to the development log for **DeltaChroma**.

DeltaChrome is built to solve a particular need that I have.  During
development of another project, I needed a set of colours for
presenting charts, graphs and other kinds of data visualisation.

The project already had a good, accessible colour palette which had,
through its evolution, become more and more streamlined and consistent
in its application. However, when we came to create a new set of
graphs, I had to decide how to colour the data.  It was only two sets
on a simple chart, so we could very easily just use appropriately high
contrast colours from the palette we had already been working on over
the past few years. But it did make me realise that we would soon need
more colours for more involved charts. At the time (which is at the
time of this initial blog post) we were launching new features which
had been a point at which we swapped out our old set of CSS files for
a new cleaaned-up version and so it seemed like a good time to add
some brand-aligned, theme-appropriate, accessible and functional
colours just for data visualisation.

I assumed this would be a matter of finding some published best
practices, probably even finding multiple palettes ready to use that
we could adopt and adapt slightly to suit.

I did find some palettes and they are good, but nothing was exactly
right. I also found lots of advice, which was also very useful. I
didn't find **exactly** what I wanted, though.  We started with
something good enough, but for a few days it irked me that it wasn't
**perfect**.

I'm pretty sure at some point someone will point me to exactly what I
needed, but at the time I was frustrated enough to start building
DeltaChroma. I'm pretty sure, subconsciously, I didn't want to find
anything perfect because it would have negated the need for tackling
an interesting problem with code.


## Useful Things I Found

Here are some really useful resources. This project doesn't seek to
replace any of them, just add to the toolkit.

- [Accessible Colour
  Palettes](https://data.europa.eu/apps/data-visualisation-guide/accessible-colour-palettes)
  is a fantastic resource from the [European Data](https://data.europa.eu/) site (which is worth bookmarking as a
  whole).  It covers how we percieve colour and gives useful information on how to choose colours for distinguishing data.
- [ColorBrewer](https://colorbrewer2.org/) has palettes that are colourblind safe but it is limited to palettes of four with this restriction.
- [Paul Tol's post on qualitative colour schemes](https://sronpersonalpages.nl/~pault/) has some palettes that are clear and seem to do well when tested for distinctive colours for people with different kinds of colour perception.
- [IWantHue](https://medialab.github.io/iwanthue/) generates palettes of a given number of colours. It does this by clustering or force-vectors, depending on your choices, and with constraints on the range of colours searched.  
- [Accessible Palette](https://accessiblepalette.com/) takes a set of colours as input and creates gradients of each, with contrast checks to show which rows meet WCAG requirements.  

### Test subheading

content

## What I Didn't Find

What I couldn't find was something that would give me:

1. A set of at least 8 colours that would be useful for presenting data...
2. ... that would be visibly different for people with various types of colour perception...
3. ... while looking at least somewhat in-keeping with the brand colours...
4. ... also having appropriate contrast against their background ...
5. ... having a light and dark variant that were reasonably related to each other  ...
4. ... and being easy to use to look back and forth from a chart to a legend.

Parts of the problem were solved by different tools.  IWantHue was
closest to the tool I imagined needing, but it does generate some
quite similar colours when asked for a set of 8.  Next to each other,
they are distinct and the tool does take into account colour
blindness. But they were close enought that on a chart with a legend,
looking from one to the other and keeping track would be
difficult. But the algorithm is very close to what I was thinking
about applying, and the [theory
page](https://medialab.github.io/iwanthue/theory/) is a fantastic
resource for anyone thinking about building such things.

Accessible Palette is great for creating schemes that meet contrast
requirements while looking consistent, but doesn't take into account
the distinctness of the individual colours, which is a key requirement
for charts and graphs.

Most of the other sites are full of useful information on how to
choose palettes, but I really wanted something that would generate
them with key constraints.  Others suggested very good palettes but
they were either too poor contrast for my light/dark schemes or have
only a limited number.


## The Goal of DeltaChroma

1. Generate palettes of various sizes, from 3 to 12.
2. Make the palette colours as visially distinct from each other as possible, for as many people as possible.
3. Account for needing a light and dark version, with a visual relationship between them. That is, colour 1 in the light mode palette might be a red that has a contrast suitable for the light background while colour 1 in the dark mode palette might be pink.  Colour 1 is always redish, colour two is always blueish, and so on.
4. Ensure both light and dark palettes maintain a contrast ratio of at least 3:1, in-line with [WCAG](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html#success-criterion).
5. Allow users to provide starting-point colours that steer the palette generation, helping align with brand guidelines.
6. Allow some of those starting-point colours to be fixed, keeping one or two key brand colours in play, with dire warnings if it produces inaccessible results.
