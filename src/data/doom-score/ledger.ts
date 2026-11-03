import type { Mention } from "./types";

/**
 * The hand-checked ledger. See types.ts for the rules. Compiled 2026-10-30
 * from primary sources where they could be opened; `verified: false` rows
 * came from a secondary list (Wikipedia's P(doom) table, third-party
 * posts) and draw hollow until the primary source is read.
 */
export const MENTIONS: Mention[] = [
  {
    "id": "compton-trinity-odds-1945",
    "date": "1945-07-16",
    "scope": "nuclear",
    "who": "Arthur Compton (as told to Pearl Buck)",
    "role": "Manhattan Project physicist, Nobel laureate",
    "p": 0.0003,
    "horizon": "Trinity test, 16 July 1945",
    "type": "interview",
    "quote": "less-than three-in-1-million chance",
    "source": {
      "title": "The Day Oppenheimer Feared He Might Blow Up the World",
      "url": "https://nautil.us/the-day-oppenheimer-feared-he-might-blow-up-the-world-355603",
      "outlet": "Nautilus (Philip Ball, 2023-07-21)"
    },
    "note": "The odds Compton set himself before the Trinity test; first reported by Pearl Buck in 1959. Buck's American Weekly 1959 piece reports Compton would proceed only if the chance of igniting the atmosphere was below ~3 in a million (SciAm/Horgan 2015 renders it 'slightly less' than one in three million). Bethe denied it in 1975: 'this claim is nonsense'. Buck's original not opened.",
    "verified": true
  },
  {
    "id": "la-602-atmosphere-ignition-1946",
    "date": "1946",
    "scope": "nuclear",
    "who": "Emil Konopinski, Cloyd Marvin, Edward Teller",
    "role": "Los Alamos physicists",
    "horizon": "atmospheric ignition by a fission/fusion bomb",
    "type": "paper",
    "quote": "the complexity of the argument and the absence of satisfactory experimental foundations makes further work on the subject highly desirable.",
    "source": {
      "title": "LA-602 vs. RHIC Review (quotes LA-602 'Ignition of the Atmosphere with Nuclear Bombs')",
      "url": "https://www.greaterwrong.com/posts/f3W7QbLBA2B7hk84y/la-602-vs-rhic-review",
      "outlet": "LessWrong / GreaterWrong (Yudkowsky, 2008-06-19)"
    },
    "note": "Report concluded ignition would not occur; declassified Feb 1973. The primary scan is image-only and the FAS host returned empty bodies on 31 Oct 2026; the sentence is as quoted in Yudkowsky's LessWrong post of 19 Jun 2008, which places it in the report's conclusion.",
    "verified": false
  },
  {
    "id": "russell-einstein-manifesto-1955",
    "date": "1955-07-09",
    "scope": "nuclear",
    "who": "Bertrand Russell, Albert Einstein and nine other signatories",
    "role": "Scientists and philosophers",
    "horizon": "unspecified",
    "type": "statement",
    "quote": "Shall we put an end to the human race: or shall mankind renounce war?",
    "source": {
      "title": "Russell-Einstein Manifesto",
      "url": "https://pugwash.org/1955/07/09/statement-manifesto/",
      "outlet": "Pugwash"
    },
    "note": "Also: 'there lies before you the risk of universal death'.",
    "verified": true
  },
  {
    "id": "kennedy-cuban-missile-crisis-1962",
    "date": "1962-10",
    "scope": "nuclear",
    "who": "John F. Kennedy",
    "role": "US President",
    "pLow": 33,
    "pHigh": 50,
    "horizon": "nuclear war during the crisis",
    "type": "statement",
    "quote": "somewhere between one-in-three and even",
    "source": {
      "title": "The Choice: Arms control or Russian roulette",
      "url": "https://thebulletin.org/?p=41015",
      "outlet": "Bulletin of the Atomic Scientists (Martin Rees, 2012-10-17)"
    },
    "note": "Rees: 'Only later did we learn that President Kennedy assessed the odds of nuclear war, at one stage, as...'. Usually traced to Sorensen's Kennedy (1965); that attribution not confirmed in a fetched page.",
    "verified": true
  },
  {
    "id": "good-last-invention-1965",
    "date": "1965",
    "scope": "ai",
    "who": "I. J. Good",
    "role": "Statistician, Bletchley Park cryptanalyst",
    "horizon": "unspecified",
    "type": "paper",
    "quote": "Thus the first ultraintelligent machine is the last invention that man need ever make, provided that the machine is docile enough to tell us how to keep it under control.",
    "source": {
      "title": "Speculations Concerning the First Ultraintelligent Machine, Advances in Computers 6, pp. 31–88",
      "url": "https://gwern.net/doc/ai/1966-good.pdf",
      "outlet": "Academic Press, scan hosted by gwern.net"
    },
    "note": "Read in the scan's text layer, journal page 33, section 2. The sentence before it introduces the phrase 'intelligence explosion'.",
    "verified": true
  },
  {
    "id": "leslie-end-of-the-world-1996",
    "date": "1996-02-16",
    "scope": "any",
    "who": "John Leslie",
    "role": "Philosopher, University of Guelph; author of The End of the World",
    "p": 40,
    "pLow": 30,
    "pHigh": 40,
    "horizon": "within 500 years",
    "type": "article",
    "quote": "I believe that humans may have little more than a half chance of surviving the next 500 years.",
    "source": {
      "title": "The end is nigh",
      "url": "https://www.timeshighereducation.com/node/7075",
      "outlet": "Times Higher Education (by Leslie)"
    },
    "note": "Same piece: 'the risk of Doom Within Five Centuries was only about 5 per cent' then 'I found myself changing this to 40 per cent.' Wikipedia's Human extinction article renders the book's figure as a 70% chance of surviving five centuries (i.e. 30% doom). Book not opened.",
    "verified": true
  },
  {
    "id": "bostrom-existential-risks-2002",
    "date": "2002",
    "scope": "any",
    "who": "Nick Bostrom",
    "role": "Philosopher, later founder of the Future of Humanity Institute",
    "pLow": 25,
    "horizon": "unspecified",
    "type": "paper",
    "quote": "My subjective opinion is that setting this probability lower than 25% would be misguided, and the best estimate may be considerably higher.",
    "source": {
      "title": "Existential Risks: Analyzing Human Extinction Scenarios and Related Hazards",
      "url": "https://nickbostrom.com/existential/risks",
      "outlet": "Journal of Evolution and Technology, vol. 9"
    },
    "note": "Section 8.6.",
    "verified": true
  },
  {
    "id": "rees-our-final-hour-2003",
    "date": "2003",
    "scope": "any",
    "who": "Martin Rees",
    "role": "Astronomer Royal; author of Our Final Hour / Our Final Century",
    "p": 50,
    "horizon": "by 2100",
    "type": "book",
    "quote": "the odds are no better than 50-50 that our present civilization on Earth will survive to the end of the present century.",
    "source": {
      "title": "Q&A: The End Is Nigh? Maybe",
      "url": "https://www.newsweek.com/qampa-end-nigh-maybe-137763",
      "outlet": "Newsweek"
    },
    "note": "Newsweek interview also has Rees: 'I do genuinely believe that the risk of a severe setback to civilization is probably 50 percent.' Goodreads quote page gives the book sentence with 'fifty-fifty'.",
    "verified": true
  },
  {
    "id": "fhi-global-catastrophic-risks-survey-2008",
    "date": "2008-07",
    "scope": "ai",
    "who": "Global Catastrophic Risk Conference participants (survey by Anders Sandberg and Nick Bostrom)",
    "role": "Informal expert survey, Oxford",
    "p": 5,
    "horizon": "by 2100",
    "type": "survey",
    "quote": "an informal survey was circulated among participants, asking them to make their best guess at the chance that there will be disasters of different types before 2100",
    "source": {
      "title": "Global Catastrophic Risks Survey, FHI Technical Report 2008-1 (Anders Sandberg and Nick Bostrom)",
      "url": "https://web.archive.org/web/20210111211647/https://www.fhi.ox.ac.uk/reports/2008-1.pdf",
      "outlet": "Future of Humanity Institute, via the Internet Archive"
    },
    "note": "Conference 17–20 July 2008. Table of median extinction risk estimates: row 'Total killed by superintelligent AI', human extinction column, 5%; row 'Overall risk of extinction prior to 2100', 19%. The report says the results 'should be taken with a grain of salt'.",
    "verified": true
  },
  {
    "id": "tim-tyler-first-pdoom-2009",
    "date": "2009-05-25",
    "scope": "any",
    "who": "Tim Tyler",
    "role": "Programmer, LessWrong commenter",
    "horizon": "unspecified",
    "type": "forum",
    "quote": "I was wondering why p(doom) has apparently been so consistently overestimated.",
    "source": {
      "title": "Comment on 'This Failing Earth'",
      "url": "https://www.greaterwrong.com/posts/2KNN9WPcyto7QH9pi/this-failing-earth/comment/nvA3JjbaMa7YGrM7J",
      "outlet": "LessWrong (GreaterWrong mirror)"
    },
    "note": "Earliest literal use of the term found anywhere, in a comment on a post about existential risk in general, not AI. Earliest dated use of the term I could open; 25 May 2009 17:52 UTC. Wikipedia credits Tyler as probable coiner; NYT (Dec 2023) says 'over a decade ago'. Comment cites Rees's 0.5 as an overestimate.",
    "verified": true
  },
  {
    "id": "shane-legg-lesswrong-qa-2011",
    "date": "2011-06-17",
    "scope": "ai",
    "who": "Shane Legg",
    "role": "Co-founder of DeepMind",
    "pLow": 5,
    "pHigh": 50,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "Maybe 5%, maybe 50%. I don't think anybody has a good estimate of this.",
    "source": {
      "title": "Q&A with Shane Legg on risks from AI",
      "url": "https://www.lesswrong.com/posts/No5JpRCHzBrWA4jmS/q-and-a-with-shane-legg-on-risks-from-ai",
      "outlet": "LessWrong"
    },
    "note": "Answer to a question where 'negative' was defined as human extinction. Page shows 17 June 2011; Wikipedia ref dates it 2011-05-17.",
    "verified": true
  },
  {
    "id": "hawking-tegmark-russell-wilczek-oped-2014",
    "date": "2014-04-19",
    "scope": "ai",
    "who": "Stephen Hawking, Max Tegmark, Stuart Russell, Frank Wilczek",
    "role": "Physicists and AI researcher",
    "horizon": "unspecified",
    "type": "article",
    "quote": "Success in creating AI would be the biggest event in human history. Unfortunately, it might also be the last, unless we learn how to avoid the risks.",
    "source": {
      "title": "Transcending Complacency on Superintelligent Machines",
      "url": "https://www.huffpost.com/entry/artificial-intelligence_b_5174265",
      "outlet": "HuffPost (also The Independent, 1 May 2014)"
    },
    "note": "",
    "verified": true
  },
  {
    "id": "bostrom-superintelligence-2014",
    "date": "2014-07-03",
    "scope": "ai",
    "who": "Nick Bostrom",
    "role": "Philosopher, Future of Humanity Institute",
    "horizon": "unspecified",
    "type": "book",
    "quote": "It is not known how the story ends, but the author dedicates this book to Scronkfinkle and his followers.",
    "source": {
      "title": "Superintelligence: Paths, Dangers, Strategies (Wikipedia)",
      "url": "https://en.wikipedia.org/wiki/Superintelligence:_Paths,_Dangers,_Strategies",
      "outlet": "Wikipedia"
    },
    "note": "Closing line of the book's unfinished fable of the sparrows. The publisher's excerpt on the OUP blog (29 Aug 2014) stops before this line; the full sentence was read in two independent reproductions of the fable, not in a Bostrom-controlled source. UK publication 3 July 2014.",
    "verified": false
  },
  {
    "id": "musk-summoning-the-demon-2014",
    "date": "2014-10",
    "scope": "ai",
    "who": "Elon Musk",
    "role": "CEO of Tesla and SpaceX",
    "horizon": "unspecified",
    "type": "talk",
    "quote": "With artificial intelligence we're summoning the demon.",
    "source": {
      "title": "Elon Musk Compares Building Artificial Intelligence To 'Summoning The Demon'",
      "url": "https://techcrunch.com/2014/10/26/elon-musk-compares-building-artificial-intelligence-to-summoning-the-demon/",
      "outlet": "TechCrunch"
    },
    "note": "MIT AeroAstro Centennial Symposium Q&A; also called AI 'our biggest existential threat'. Live Science dates the talk 24 Oct 2014 (not confirmed in a fetched page).",
    "verified": true
  },
  {
    "id": "hawking-bbc-end-of-human-race-2014",
    "date": "2014-12-02",
    "scope": "ai",
    "who": "Stephen Hawking",
    "role": "Theoretical physicist",
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I think the development of full artificial intelligence could spell the end of the human race.",
    "source": {
      "title": "Even Stephen Hawking fears the rise of machines",
      "url": "https://www.theglobeandmail.com/technology/even-stephen-hawking-fears-the-rise-of-machines/article21888416",
      "outlet": "The Globe and Mail (reporting BBC interview)"
    },
    "note": "BBC original (https://www.bbc.com/news/technology-30290540) blocked.",
    "verified": true
  },
  {
    "id": "altman-machine-intelligence-2015",
    "date": "2015-02",
    "scope": "ai",
    "who": "Sam Altman",
    "role": "President of Y Combinator (later CEO of OpenAI)",
    "horizon": "unspecified",
    "type": "article",
    "quote": "Development of superhuman machine intelligence (SMI) is probably the greatest threat to the continued existence of humanity.",
    "source": {
      "title": "Machine intelligence, part 1",
      "url": "https://blog.samaltman.com/machine-intelligence-part-1",
      "outlet": "Sam Altman's blog"
    },
    "note": "Page shows no date; widely dated 25 Feb 2015.",
    "verified": true
  },
  {
    "id": "ai-impacts-expert-survey-2016",
    "date": "2016",
    "scope": "ai",
    "who": "AI researchers surveyed by AI Impacts (Grace et al.)",
    "role": "Expert survey of NIPS/ICML authors",
    "p": 5,
    "horizon": "long-run impact of human-level machine intelligence",
    "type": "survey",
    "quote": "The median researcher thinks AI has a one in twenty chance of being extremely bad on net.",
    "source": {
      "title": "2016 Expert Survey on Progress in AI",
      "url": "https://aiimpacts.org/2016-expert-survey-on-progress-in-ai/",
      "outlet": "AI Impacts"
    },
    "note": "Outcome category 'extremely bad (e.g. human extinction)'. Published as Grace et al. 2018, 'When Will AI Exceed Human Performance?'.",
    "verified": true
  },
  {
    "id": "ord-precipice-total-2020",
    "date": "2020-03",
    "scope": "any",
    "who": "Toby Ord",
    "role": "Philosopher, Oxford; author of The Precipice",
    "p": 16.7,
    "horizon": "next 100 years",
    "type": "book",
    "quote": "And this is something where I now think that the risk is high enough, that this century, it's about one in six.",
    "source": {
      "title": "Toby Ord on the precipice and humanity's potential futures, 80,000 Hours podcast episode 72 (transcript)",
      "url": "https://80000hours.org/podcast/episodes/toby-ord-the-precipice-existential-risk-future-humanity/",
      "outlet": "80,000 Hours"
    },
    "note": "Transcript of the interview recorded for the book's launch; the book itself gives the same one in six.",
    "verified": true
  },
  {
    "id": "ord-precipice-ai-2020",
    "date": "2020-03",
    "scope": "ai",
    "who": "Toby Ord",
    "role": "Philosopher, Oxford; author of The Precipice",
    "p": 10,
    "horizon": "next 100 years",
    "type": "book",
    "quote": "If you put that together, you get a 10% chance that's the time where we lost control of the future in a negative way.",
    "source": {
      "title": "Toby Ord on the precipice and humanity's potential futures, 80,000 Hours podcast episode 72 (transcript)",
      "url": "https://80000hours.org/podcast/episodes/toby-ord-the-precipice-existential-risk-future-humanity/",
      "outlet": "80,000 Hours"
    },
    "note": "The 'that' is the chance of advanced AI this century combined with the chance it goes badly; the book's table gives one in ten for unaligned AI.",
    "verified": true
  },
  {
    "id": "ai-safety-researchers-survey-2021",
    "date": "2021-06-01",
    "scope": "ai",
    "who": "44 AI safety researchers (survey by Rob Bensinger, MIRI)",
    "role": "Survey of alignment researchers",
    "p": 20,
    "pLow": 20,
    "pHigh": 30,
    "horizon": "unspecified",
    "type": "survey",
    "quote": "drastically less than it could have been",
    "source": {
      "title": "Existential risk from AI survey results",
      "url": "https://www.alignmentforum.org/posts/QvwSr5LsxyDeaPK5s/existential-risk-from-ai-survey-results",
      "outlet": "AI Alignment Forum"
    },
    "note": "Question: probability the future's value is 'drastically less than it could have been' due to AI safety failure. Medians (0.2, 0.3) and means (~0.3, ~0.4) across two phrasings. PauseAI lists this as 30% (mean).",
    "verified": true
  },
  {
    "id": "yudkowsky-death-with-dignity-2022",
    "date": "2022-04-02",
    "scope": "ai",
    "who": "Eliezer Yudkowsky",
    "role": "Founder, Machine Intelligence Research Institute",
    "horizon": "unspecified",
    "type": "forum",
    "quote": "It's obvious at this point that humanity isn't going to solve the alignment problem, or even try very hard",
    "source": {
      "title": "MIRI announces new 'Death With Dignity' strategy",
      "url": "https://www.greaterwrong.com/posts/j9Q8bRmwCgXRYAgcJ/miri-announces-new-death-with-dignity-strategy",
      "outlet": "LessWrong (GreaterWrong mirror)"
    },
    "note": "Posted 1 April (US) / 2 April 2022 UTC. Also: doubling survival odds 'will only take them from 0% to 0%'.",
    "verified": true
  },
  {
    "id": "cotra-without-countermeasures-2022",
    "date": "2022-07-18",
    "scope": "ai",
    "who": "Ajeya Cotra",
    "role": "Senior researcher, Open Philanthropy",
    "pLow": 50,
    "horizon": "conditional on near-term transformative AI built with current methods",
    "type": "forum",
    "quote": "I don't think this is a certainty, but it looks like the best-guess default absent specific efforts to prevent it.",
    "source": {
      "title": "Without specific countermeasures, the easiest path to transformative AI likely leads to AI takeover",
      "url": "https://www.greaterwrong.com/posts/pRkFkzwKZ2zfa3R6H/without-specific-countermeasures-the-easiest-path-to",
      "outlet": "LessWrong (GreaterWrong mirror)"
    },
    "note": "Post argues humanity is 'more likely than not to be taken over by misaligned AI' if three assumptions hold. Her 50% for an 'obsolescence regime' by 2038 (ABC, July 2023) is a timeline, not a doom probability.",
    "verified": true
  },
  {
    "id": "ai-impacts-expert-survey-2022",
    "date": "2022-08",
    "scope": "ai",
    "who": "738 AI researchers surveyed by AI Impacts",
    "role": "Expert survey of NeurIPS/ICML authors (17% response)",
    "p": 5,
    "horizon": "unspecified",
    "type": "survey",
    "quote": "future AI advances causing human extinction or similarly permanent and severe disempowerment of the human species",
    "source": {
      "title": "2022 Expert Survey on Progress in AI",
      "url": "https://aiimpacts.org/2022-expert-survey-on-progress-in-ai/",
      "outlet": "AI Impacts"
    },
    "note": "Median 5% on that question; on 'extremely bad (e.g. human extinction)' outcomes median 5%, 48% of respondents gave at least 10%, 25% gave 0%. Responses 12 June to 3 Aug 2022.",
    "verified": true
  },
  {
    "id": "karnofsky-nearcast-2022",
    "date": "2022-08-29",
    "scope": "ai",
    "who": "Holden Karnofsky",
    "role": "Co-CEO, Open Philanthropy",
    "pLow": 10,
    "pHigh": 90,
    "horizon": "nearcast: transformative AI developed very soon",
    "type": "forum",
    "quote": "I don't currently have much sympathy for someone who's highly confident that AI takeover would or would not happen",
    "source": {
      "title": "How might we align transformative AI if it's developed very soon?",
      "url": "https://www.alignmentforum.org/posts/rCJQAkPTEypGjSJ8X/how-might-we-align-transformative-ai-if-it-s-developed-very",
      "outlet": "AI Alignment Forum"
    },
    "note": "The 10% and 90% are his thresholds for 'highly confident'; he gives no point estimate. Wikipedia/PauseAI list this as 10-90%.",
    "verified": true
  },
  {
    "id": "lifland-ea-forum-2023",
    "date": "2023-02-01",
    "scope": "ai",
    "who": "Eli Lifland",
    "role": "Forecaster, Samotsvety; later AI Futures Project",
    "p": 35,
    "pLow": 35,
    "pHigh": 40,
    "horizon": "by 2070",
    "type": "interview",
    "quote": "maybe like 35% or 40% now, just for the intent misalignment branch",
    "source": {
      "title": "Eli Lifland on navigating the AI alignment landscape",
      "url": "https://ea.greaterwrong.com/posts/QeLE22fefLqKfYTW6/eli-lifland-on-navigating-the-ai-alignment-landscape",
      "outlet": "EA Forum (GreaterWrong mirror)"
    },
    "note": "Also 'something like 35 to 40% for any AI-mediated existential catastrophe'. PauseAI lists 35%.",
    "verified": true
  },
  {
    "id": "scott-alexander-not-as-much-doomer-2023",
    "date": "2023-03-14",
    "scope": "ai",
    "who": "Scott Alexander",
    "role": "Writer, Astral Codex Ten",
    "p": 33,
    "horizon": "unspecified",
    "type": "article",
    "quote": "if you force me to give an estimate it's probably around 33%",
    "source": {
      "title": "Why I Am Not (As Much Of) A Doomer (As Some People)",
      "url": "https://www.astralcodexten.com/p/why-i-am-not-as-much-of-a-doomer",
      "outlet": "Astral Codex Ten"
    },
    "note": "Post also tabulates others: Aaronson 2%, MacAskill 3%, median ML researcher 5-10%, Christiano 10-20%, Lifland 35%, Karnofsky 50% (related question), Yudkowsky 'seems to think >90%'.",
    "verified": true
  },
  {
    "id": "fli-pause-letter-2023",
    "date": "2023-03-22",
    "scope": "ai",
    "who": "Future of Life Institute and signatories (Musk, Wozniak, Bengio, Russell and others)",
    "role": "Open letter",
    "horizon": "unspecified",
    "type": "statement",
    "quote": "we call on all AI labs to immediately pause for at least 6 months the training of AI systems more powerful than GPT-4",
    "source": {
      "title": "Pause Giant AI Experiments: An Open Letter",
      "url": "https://futureoflife.org/open-letter/pause-giant-ai-experiments/",
      "outlet": "Future of Life Institute"
    },
    "note": "Also asks 'Should we risk loss of control of our civilization?'. 31,810 signatories shown.",
    "verified": true
  },
  {
    "id": "yudkowsky-time-shut-it-all-down-2023",
    "date": "2023-03-29",
    "scope": "ai",
    "who": "Eliezer Yudkowsky",
    "role": "Founder, Machine Intelligence Research Institute",
    "horizon": "unspecified",
    "type": "article",
    "quote": "the most likely result of building a superhumanly smart AI, under anything remotely like the current circumstances, is that literally everyone on Earth will die.",
    "source": {
      "title": "Pausing AI Developments Isn't Enough. We Need to Shut it All Down",
      "url": "https://time.com/6266923/ai-eliezer-yudkowsky-open-letter-not-enough/",
      "outlet": "TIME"
    },
    "note": "Wikipedia/PauseAI tabulate Yudkowsky at >95% citing Fast Company (2023-07-12), which I could not open.",
    "verified": true
  },
  {
    "id": "hendrycks-pdoom-80-2023",
    "date": "2023-04-02",
    "scope": "ai",
    "who": "Dan Hendrycks",
    "role": "Director, Center for AI Safety",
    "pLow": 80,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "As it happens, my p(doom) > 80%, but it has been lower in the past. Two years ago it was ~20%.",
    "source": {
      "title": "Post on X (@DanHendrycks), 2 Apr 2023",
      "url": "https://x.com/DanHendrycks/status/1642394635657162753",
      "outlet": "X (read via api.fxtwitter.com mirror)"
    },
    "note": "Reply to @ylecun and others, linking 'Natural Selection Favors AIs over Humans'.",
    "verified": true
  },
  {
    "id": "christiano-my-views-on-doom-2023",
    "date": "2023-04-27",
    "scope": "ai",
    "who": "Paul Christiano",
    "role": "Founder, Alignment Research Center; later US AI Safety Institute",
    "p": 46,
    "horizon": "within 10 years of building powerful AI",
    "type": "forum",
    "quote": "Probability that humanity has somehow irreversibly messed up our future within 10 years of building powerful AI: 46%",
    "source": {
      "title": "My views on 'doom'",
      "url": "https://www.lesswrong.com/posts/xWMqsvHapP3nwdSW8/my-views-on-doom",
      "outlet": "LessWrong (crosspost of ai-alignment.com)"
    },
    "note": "Same post: AI takeover 22%; most humans die within 10 years of powerful AI 20%. The Independent (3 May 2023, not opened) reported a '50% chance' from his Bankless appearance; Wikipedia lists 50%, PauseAI 46%.",
    "verified": true
  },
  {
    "id": "kokotajlo-70-percent-2023",
    "date": "2023-05",
    "scope": "ai",
    "who": "Daniel Kokotajlo",
    "role": "Governance researcher, OpenAI (left 2024)",
    "p": 70,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "I think AI doom is 70% likely.",
    "source": {
      "title": "Comment on 'Adumbrations on AGI from an outsider'",
      "url": "https://www.lesswrong.com/posts/xDkdR6JcQsCdnFpaQ/adumbrations-on-agi-from-an-outsider?commentId=sHnfPe5pHJhjJuCWW",
      "outlet": "LessWrong"
    },
    "note": "Post dated 24 May 2023; comment timestamp shown only as relative. He repeated ~70% to the NYT in June 2024 (not opened; Futurism 2024-06-04 reports it without a direct quote).",
    "verified": true
  },
  {
    "id": "hinton-leaves-google-2023",
    "date": "2023-05-02",
    "scope": "ai",
    "who": "Geoffrey Hinton",
    "role": "Computer scientist, 'godfather of AI'; left Google",
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I have suddenly switched my views on whether these things are going to be more intelligent than us.",
    "source": {
      "title": "Geoffrey Hinton tells us why he's now scared of the tech he helped build",
      "url": "https://www.technologyreview.com/2023/05/02/1072528/geoffrey-hinton-google-why-scared-ai/",
      "outlet": "MIT Technology Review"
    },
    "note": "Also 'How do we survive that?' NYT 1 May 2023 piece not opened.",
    "verified": true
  },
  {
    "id": "cais-statement-on-ai-risk-2023",
    "date": "2023-05-30",
    "scope": "ai",
    "who": "Center for AI Safety and signatories (Hinton, Bengio, Altman, Amodei, Hassabis, Sutskever, Gates, Russell)",
    "role": "One-sentence statement",
    "horizon": "unspecified",
    "type": "statement",
    "quote": "Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war.",
    "source": {
      "title": "Statement on AI Risk",
      "url": "https://www.safe.ai/work/statement-on-ai-risk",
      "outlet": "Center for AI Safety"
    },
    "note": "Page itself undated; press coverage 30-31 May 2023.",
    "verified": true
  },
  {
    "id": "emmett-shear-5-50-2023",
    "date": "2023-06-16",
    "scope": "ai",
    "who": "Emmett Shear",
    "role": "Twitch co-founder; interim CEO of OpenAI, Nov 2023",
    "pLow": 5,
    "pHigh": 50,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "His percentage chance of doom for humanity due to artificial intelligence is 5-50%.",
    "source": {
      "title": "Post on X (@loganbartlett), 20 Nov 2023",
      "url": "https://x.com/loganbartlett/status/1726662761785024966",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "Said on The Logan Bartlett Show episode 69, 16 Jun 2023; no transcript readable, so the host's summary is quoted. Shear wrote on 25 Jun 2023 that the interview 'more or less captures my high level beliefs around AI and how dangerous it is'. On My First Million (11 Sep 2023, auto transcript) he said 'somewhere between 3 to 30%'. No 'good days, bad days' wording was found in his own words.",
    "verified": false
  },
  {
    "id": "xpt-superforecasters-2023",
    "date": "2023-07-10",
    "scope": "ai",
    "who": "Superforecasters, Existential Risk Persuasion Tournament (Forecasting Research Institute)",
    "role": "89 superforecasters, tournament June-Oct 2022",
    "p": 0.38,
    "horizon": "by 2100",
    "type": "survey",
    "quote": "The median superforecaster's unconditional forecast of AI-driven extinction by 2100 was 0.38%.",
    "source": {
      "title": "The Extinction Tournament (quoting the XPT report)",
      "url": "https://www.astralcodexten.com/p/the-extinction-tournament",
      "outlet": "Astral Codex Ten (2023-07-20); report at forecastingresearch.org/xpt"
    },
    "note": "Working paper 'Forecasting Existential Risks' published 10 July 2023, revised 8 Aug 2023. Report PDF link 404; numbers read in ACX's block quote.",
    "verified": true
  },
  {
    "id": "xpt-domain-experts-2023",
    "date": "2023-07-10",
    "scope": "ai",
    "who": "Domain experts, Existential Risk Persuasion Tournament (Forecasting Research Institute)",
    "role": "80 experts, tournament June-Oct 2022",
    "p": 3,
    "horizon": "by 2100",
    "type": "survey",
    "quote": "the superforecasters got an 0.4% probability of AI-based extinction, compared to the domain experts' 3%",
    "source": {
      "title": "The Extinction Tournament",
      "url": "https://www.astralcodexten.com/p/the-extinction-tournament",
      "outlet": "Astral Codex Ten"
    },
    "note": "Secondary sources also give total extinction by 2100 of ~1% (superforecasters) vs ~6% (experts); not read in a fetched page.",
    "verified": true
  },
  {
    "id": "bengio-20-percent-2023",
    "date": "2023-07-15",
    "scope": "ai",
    "who": "Yoshua Bengio",
    "role": "Computer scientist, Mila; Turing Award",
    "p": 20,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I got around, like, 20 per cent probability that it turns out catastrophic.",
    "source": {
      "title": "It started as a dark in-joke. It could also be one of the most important questions facing humanity",
      "url": "https://www.abc.net.au/news/2023-07-15/whats-your-pdoom-ai-researchers-worry-catastrophe/102591340",
      "outlet": "ABC News (Background Briefing, Ange Lavoipierre)"
    },
    "note": "Built from ~50% for human-level AI within a decade and >50% that it turns against humanity.",
    "verified": true
  },
  {
    "id": "leike-10-90-2023",
    "date": "2023-08-07",
    "scope": "ai",
    "who": "Jan Leike",
    "role": "Head of alignment at OpenAI (later Anthropic)",
    "pLow": 10,
    "pHigh": 90,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I don't think it's a really useful question, because I think at least I personally feel like my answer would depend a lot more on my current mood than any actual property of the world.",
    "source": {
      "title": "Jan Leike on OpenAI's massive push to make superintelligence safe in 4 years or less (transcript)",
      "url": "https://80000hours.org/podcast/episodes/jan-leike-superalignment/",
      "outlet": "80,000 Hours Podcast"
    },
    "note": "The range is the host's. Rob Wiblin: 'My guess is that it's more than 10% and less than 90%.' Leike: 'Yeah. That's probably the range I would give too.' Wikipedia dates the row 12 Jul 2023 from a later Fast Company piece.",
    "verified": true
  },
  {
    "id": "amodei-10-25-2023",
    "date": "2023-10-06",
    "scope": "ai",
    "who": "Dario Amodei",
    "role": "CEO, Anthropic",
    "pLow": 10,
    "pHigh": 25,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "Dario Amodei's P(doom) is 10–25%.",
    "source": {
      "title": "Post on X (@liron), 7 Oct 2023",
      "url": "https://x.com/liron/status/1710520914444718459",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "The Logan Bartlett Show episode 82, released 6 Oct 2023, about 1 h 38 min in. No readable transcript could be found. Newsbusters (25 Oct 2023) renders it 'chance something goes really quite catastrophically wrong on the scale of human civilization might be somewhat 10 to 25 percent'; the New York Times (6 Dec 2023) paraphrases it as between 10 and 25 per cent. Number and date are solid; the sentence is not read in the source.",
    "verified": false
  },
  {
    "id": "lina-khan-15-percent-2023",
    "date": "2023-11-10",
    "scope": "ai",
    "who": "Lina Khan",
    "role": "Chair, US Federal Trade Commission",
    "p": 15,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "No, no, not zero. Maybe, like, 15 percent.",
    "source": {
      "title": "Hard Fork: Personalized GPTs Are Here + F.T.C. Chair Lina Khan on A.I. Competition (transcript)",
      "url": "https://www.nytimes.com/2023/11/10/podcasts/hardfork-chatbot-ftc.html?showTranscript=1",
      "outlet": "The New York Times, Hard Fork"
    },
    "note": "Kevin Roose asked 'What is your P doom, Lina Khan? What is your probability that AI will kill us all?' She first said she had to stay an optimist and would hedge towards lower risk; Roose asked 'So are you zero?' Also transcribed by Casey Newton in Platformer, 13 Nov 2023.",
    "verified": true
  },
  {
    "id": "buterin-pdoom-0-1-2023",
    "date": "2023-11-27",
    "scope": "ai",
    "who": "Vitalik Buterin",
    "role": "Co-founder of Ethereum",
    "p": 10,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "AI risk 1: existential risk. My p(doom) is around 0.1.",
    "source": {
      "title": "Post on X (@VitalikButerin), 27 Nov 2023",
      "url": "https://x.com/VitalikButerin/status/1729251822391447904",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "Same day as his essay 'My techno-optimism', which cites the 5-10% researcher survey. Wikipedia lists 12% from a 2025 Doom Debates episode (not opened).",
    "verified": true
  },
  {
    "id": "nyt-silicon-valley-grim-metric-2023",
    "date": "2023-12-06",
    "scope": "ai",
    "who": "Kevin Roose (New York Times), quoting Tim Tyler and others",
    "role": "Journalist",
    "horizon": "unspecified",
    "type": "article",
    "quote": "refer to the probability of doom without being too specific about the time scale or the definition of 'doom.'",
    "source": {
      "title": "Silicon Valley Guys Casually Calculating Probability Their AI Will Destroy Humankind (Futurism report on the NYT piece)",
      "url": "https://malaysia.news.yahoo.com/silicon-valley-guys-casually-calculating-180622671.html",
      "outlet": "Futurism via Yahoo (2023-12-08)"
    },
    "note": "NYT original 'Silicon Valley Confronts a Grim New A.I. Metric' blocked. Futurism: NYT credits Tyler with first use; Yudkowsky's p(doom) given as 'yes'; Aaron Levie 'about as low as it could be'. Wikipedia lists Roose at 5-15%.",
    "verified": false
  },
  {
    "id": "aaronson-2-percent-2023",
    "date": "2023-12-13",
    "scope": "ai",
    "who": "Scott Aaronson",
    "role": "Theoretical computer scientist, UT Austin; ex-OpenAI",
    "p": 2,
    "horizon": "unspecified",
    "type": "article",
    "quote": "To set the record straight: I once gave a ~2% probability for the classic AGI-doom paperclip-maximizer-like scenario.",
    "source": {
      "title": "On being wrong about AI",
      "url": "https://scottaaronson.blog/?p=7672",
      "outlet": "Shtetl-Optimized"
    },
    "note": "",
    "verified": true
  },
  {
    "id": "lecun-below-0-01-2023",
    "date": "2023-12-18",
    "scope": "ai",
    "who": "Yann LeCun",
    "role": "Chief AI Scientist, Meta; Turing Award",
    "pHigh": 0.01,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "Yann LeCun's P(doom) is <0.01%. 'Below the chances of an asteroid hitting the earth' —@ylecun",
    "source": {
      "title": "Post on X (@liron), 18 Dec 2023",
      "url": "https://x.com/liron/status/1736555643384025428",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "Liron Shapira's post with a 38-second clip of LeCun; the interview the clip comes from is unidentified and the spoken words are not verified. LeCun's own written position: 7 Feb 2024, 'P(doom) is BS.'; 21 Apr 2026, 'p(doom) is smaller than the probability of an extinction-level asteroid hitting the earth in the next millennium' (see his 2026 row).",
    "verified": false
  },
  {
    "id": "zvi-60-percent-2023",
    "date": "2024-01-01",
    "scope": "ai",
    "who": "Zvi Mowshowitz",
    "role": "Writer, Don't Worry About the Vase",
    "p": 60,
    "horizon": "unspecified",
    "type": "statement",
    "quote": "I have mentioned several times that I refer to it as p(0.6) in my posts.",
    "source": {
      "title": "Will Zvi's p(doom) go down substantially in 2024? (market created by Zvi Mowshowitz)",
      "url": "https://manifold.markets/ZviMowshowitz/will-zvis-pdoom-go-down-substantial",
      "outlet": "Manifold Markets"
    },
    "note": "Zvi's own market, created 1 Jan 2024. Its description: he would resolve YES if 'he would now pick a number lower than his current (as of 1/1/24) 60%'. It resolved NO. The earlier attribution to a Doom Debates episode on 27 Nov 2023 was wrong; the show did not exist until 2024.",
    "verified": true
  },
  {
    "id": "grace-thousands-of-ai-authors-2024",
    "date": "2024-01-05",
    "scope": "ai",
    "who": "2,778 AI researchers surveyed by AI Impacts (Grace et al.)",
    "role": "Largest expert survey of its kind; fielded 11-24 Oct 2023",
    "p": 5,
    "horizon": "unspecified",
    "type": "paper",
    "quote": "Between 38% and 51% of respondents gave at least a 10% chance to advanced AI leading to outcomes as bad as human extinction.",
    "source": {
      "title": "Thousands of AI Authors on the Future of AI",
      "url": "https://arxiv.org/abs/2401.02843",
      "outlet": "arXiv"
    },
    "note": "Median 5% on 'human extinction or similarly permanent and severe disempowerment' (mean 16.2%); 10% median on the 'inability to control' phrasing (mean 19.4%); 5% within 100 years (mean 14.4%) per wiki.aiimpacts.org.",
    "verified": true
  },
  {
    "id": "hassabis-greater-than-zero-2024",
    "date": "2024-02-23",
    "scope": "ai",
    "who": "Demis Hassabis",
    "role": "CEO, Google DeepMind",
    "pLow": 0,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I think it's kind of a nonsense to precisely put a probability on it. What I do know is it's non-zero, that risk, right? So it's definitely worth debating, and it's worth researching really carefully.",
    "source": {
      "title": "Hard Fork: Google DeepMind C.E.O. Demis Hassabis on the Path From Chatbots to A.G.I. (transcript)",
      "url": "https://www.nytimes.com/2024/02/23/podcasts/google-deepmind-demis-hassabis.html?showTranscript=1",
      "outlet": "The New York Times, Hard Fork"
    },
    "note": "Asked by Kevin Roose for his p(doom). He points to Hinton and LeCun being in opposite camps as evidence that 'we don't know'. The YouTube numbering 'EP 71' is this episode.",
    "verified": true
  },
  {
    "id": "yampolskiy-99-999999-2024",
    "date": "2024-03-12",
    "scope": "ai",
    "who": "Roman Yampolskiy",
    "role": "Computer scientist, University of Louisville",
    "p": 99.999999,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "I am at 99.999999% https://pauseai.info/pdoom",
    "source": {
      "title": "Post on X (@romanyam), 12 Mar 2024",
      "url": "https://x.com/romanyam/status/1767575356155027503",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "",
    "verified": true
  },
  {
    "id": "musk-abundance-summit-2024",
    "date": "2024-03-19",
    "scope": "ai",
    "who": "Elon Musk",
    "role": "CEO of Tesla, SpaceX, X; founder of xAI",
    "pLow": 10,
    "pHigh": 20,
    "horizon": "unspecified",
    "type": "talk",
    "quote": "I probably agree with Geoff Hinton that it's about 10 per cent or 20 per cent or something like that.",
    "source": {
      "title": "Elon Musk Warns of 10-20% Chance of AI Threat to Humanity: Insights from Abundance Summit",
      "url": "https://www.thehansindia.com/tech/elon-musk-warns-of-10-20-chance-of-ai-threat-to-humanity-insights-from-abundance-summit-869303",
      "outlet": "The Hans India (2024-04-01), reporting Business Insider"
    },
    "note": "'Great AI Debate' seminar, Abundance Summit. Also: 'I think that the probable positive scenario outweighs the negative scenario.' Business Insider original blocked.",
    "verified": true
  },
  {
    "id": "yampolskiy-lex-fridman-2024",
    "date": "2024-06",
    "scope": "ai",
    "who": "Roman Yampolskiy",
    "role": "Computer scientist, University of Louisville",
    "p": 99.99,
    "horizon": "next hundred years",
    "type": "interview",
    "quote": "at 99.99 and many more nines percent",
    "source": {
      "title": "Roman Yampolskiy: Dangers of Superintelligent AI | Lex Fridman Podcast #431 (transcript)",
      "url": "https://lexfridman.com/roman-yampolskiy-transcript/",
      "outlet": "Lex Fridman Podcast"
    },
    "note": "Words are Fridman's intro describing Yampolskiy's figure; Fridman frames the question as 'in the next hundred years' and says AI engineers put p(doom) 'around one to 20%'. Page footer dated 3 June 2024. Business Insider's '99.9%' write-up not opened.",
    "verified": true
  },
  {
    "id": "hinton-metr-49-percent-2024",
    "date": "2024-06-27",
    "scope": "ai",
    "who": "Geoffrey Hinton",
    "role": "Computer scientist, 'godfather of AI'",
    "pLow": 10,
    "pHigh": 20,
    "horizon": "unspecified",
    "type": "talk",
    "quote": "I tend to be slightly depressive so I think we haven't got a clue, so 50% is a good number. But other people think we have got some clue, and so I moderate that to 10% to 20%.",
    "source": {
      "title": "Geoffrey Hinton on the Past, Present, and Future of AI (Stephen McAleese's transcription of the METR Q&A)",
      "url": "https://www.lesswrong.com/posts/zJz8KXSRsproArXq5/geoffrey-hinton-on-the-past-present-and-future-of-ai",
      "outlet": "LessWrong, transcribing the METR video of 27 Jun 2024"
    },
    "note": "Words transcribed by a third party from the METR Q&A video (youtube.com/watch?v=PTF5Up1hMhw, about 39 minutes in); the video itself could not be opened from here. His own gut figure is 50%; the range he settles on is 10–20%. The earlier '~49%' was Liron Shapira's rendering on X.",
    "verified": true
  },
  {
    "id": "reid-hoffman-pbs-2024",
    "date": "2024-08-23",
    "scope": "ai",
    "who": "Reid Hoffman",
    "role": "Co-founder of LinkedIn; investor",
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I'm going to go for two on that answer.",
    "source": {
      "title": "Experts debate level of threat AI advances pose to humanity",
      "url": "https://www.pbs.org/video/future-of-ai-1724451272/",
      "outlet": "PBS News Hour"
    },
    "note": "Answer on a 1 (no threat) to 10 (extinction) scale. PauseAI lists this as 20%, which is an interpretation, not his number.",
    "verified": true
  },
  {
    "id": "andrew-critch-85-2024",
    "date": "2024-10-12",
    "scope": "ai",
    "who": "Andrew Critch",
    "role": "Founder, Center for Applied Rationality; AI researcher",
    "p": 85,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "I also currently think there's around a 15% chance that humanity will survive through the development of artificial intelligence. In other words, I think there's around an 85% chance that we will not survive the transition.",
    "source": {
      "title": "My motivation and theory of change for working in AI healthtech",
      "url": "https://www.lesswrong.com/posts/Kobbt3nQgv3yn29pr/my-motivation-and-theory-of-change-for-working-in-ai",
      "outlet": "LessWrong"
    },
    "note": "Read via greaterwrong.com. He breaks it down as about 35% loss of control of early AGI plus about 50% gradual ceding of control, mostly 2030 to 2040. Repeated on Doom Debates on 16 Nov 2024.",
    "verified": true
  },
  {
    "id": "connor-leahy-90-plus-2024",
    "date": "2024-11-22",
    "scope": "ai",
    "who": "Connor Leahy",
    "role": "Co-founder of EleutherAI; CEO of Conjecture",
    "pLow": 90,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "90%+",
    "source": {
      "title": "P(doom) (Wikipedia table), citing FLI podcast 'Connor Leahy on Why Humanity Risks Extinction from AGI'",
      "url": "https://en.wikipedia.org/wiki/P(doom)",
      "outlet": "Wikipedia"
    },
    "note": "The FLI episode's partial transcript (zencastr.com/z/v9ifF8BJ) contains no percentage; Wikipedia's '90%+' rests on the video alone, which could not be opened from here. Kept as reported, unverified.",
    "verified": false
  },
  {
    "id": "mostaque-50-percent-2024",
    "date": "2024-12-04",
    "scope": "ai",
    "who": "Emad Mostaque",
    "role": "Founder, Stability AI",
    "p": 50,
    "horizon": "undefined time period",
    "type": "forum",
    "quote": "My P(doom) is 50%.",
    "source": {
      "title": "Post on X (@EMostaque), 4 Dec 2024",
      "url": "https://x.com/EMostaque/status/1864266899170767105",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "Continues: 'Given an undefined time period the probability of systems that are more capable than humans and likely' to control critical infrastructure wiping out humanity is roughly even.",
    "verified": true
  },
  {
    "id": "hinton-bbc-radio4-10-20-2024",
    "date": "2024-12-27",
    "scope": "ai",
    "who": "Geoffrey Hinton",
    "role": "Nobel laureate in Physics 2024; 'godfather of AI'",
    "pLow": 10,
    "pHigh": 20,
    "horizon": "within 30 years",
    "type": "interview",
    "quote": "10% to 20%",
    "source": {
      "title": "Godfather of AI warns: AI could wipe out humanity in the next 30 years",
      "url": "https://www.zmescience.com/science/news-science/ai-risks-hinton-warnings",
      "outlet": "ZME Science (2024-12-30), reporting BBC Radio 4 Today"
    },
    "note": "His answer when asked to assess the risk; previously he had said 10%. Countercurrents (2024-12-29) adds: 'We've never had to deal with things more intelligent than ourselves before.' Guardian/BBC originals blocked.",
    "verified": true
  },
  {
    "id": "nate-silver-2025",
    "date": "2025-01-27",
    "scope": "ai",
    "who": "Nate Silver",
    "role": "Statistician; founder of FiveThirtyEight",
    "pLow": 5,
    "pHigh": 10,
    "horizon": "unspecified",
    "type": "article",
    "quote": "My estimate of p(doom) would be considered high by normal person standards",
    "source": {
      "title": "It's time to come to grips with AI",
      "url": "https://www.natesilver.net/p/its-time-to-come-to-grips-with-ai",
      "outlet": "Silver Bulletin"
    },
    "note": "Gives no personal number; says his estimate 'is well in line with the expert consensus, which puts the chances at 5 to 10 percent'. Wikipedia/PauseAI tabulate 5-10%.",
    "verified": true
  },
  {
    "id": "macaskill-1-10-2025",
    "date": "2025-02-07",
    "scope": "ai",
    "who": "William MacAskill",
    "role": "Philosopher, Oxford; co-founder of effective altruism",
    "pLow": 1,
    "pHigh": 10,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I'm still on the more optimistic end: 1% to 10%",
    "source": {
      "title": "Will MacAskill on AI causing a 'century in a decade'",
      "url": "https://80000hours.org/podcast/episodes/will-macaskill-century-in-a-decade-navigating-intelligence-explosion/",
      "outlet": "80,000 Hours Podcast"
    },
    "note": "Recorded 7 Feb 2025. Adds 'that's what my chance of existential risk from AI is'; notes some people he talks to put takeover at ~70%.",
    "verified": true
  },
  {
    "id": "musk-rogan-20-percent-annihilation-2025",
    "date": "2025-02-28",
    "scope": "ai",
    "who": "Elon Musk",
    "role": "CEO of Tesla, SpaceX, xAI",
    "p": 20,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "only a 20% chance of annihilation",
    "source": {
      "title": "Elon Musk says there's 'only a 20% chance of annihilation' with AI",
      "url": "https://www.aol.com/elon-musk-says-theres-only-001804145.html",
      "outlet": "Business Insider via AOL (2025-03-01)"
    },
    "note": "Joe Rogan Experience; also 'The probability of a good outcome is like 80%'.",
    "verified": true
  },
  {
    "id": "kokotajlo-70-80-ai-2027-2025",
    "date": "2025-04-03",
    "scope": "ai",
    "who": "Daniel Kokotajlo",
    "role": "Founder, AI Futures Project; lead author of AI 2027",
    "p": 70,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "People ask about P(doom), right? And my P(doom) is sort of infamously high, like 70%. Well, that's what it is. And part of the reason for that is just that I feel like a bunch of stuff has to go right.",
    "source": {
      "title": "AI 2027: month-by-month model of intelligence explosion (Dwarkesh Podcast transcript)",
      "url": "https://www.dwarkesh.com/p/scott-daniel",
      "outlet": "Dwarkesh Podcast"
    },
    "note": "Official transcript. Wikipedia's '70–80%' conflates his 70% with Scott Alexander's remark about 80% of scenarios where we survive.",
    "verified": true
  },
  {
    "id": "tegmark-compton-constant-2025",
    "date": "2025-04-30",
    "scope": "ai",
    "who": "Max Tegmark",
    "role": "Physicist, MIT; president of the Future of Life Institute",
    "pLow": 90,
    "horizon": "race to AGI",
    "type": "forum",
    "quote": "Our new paper tries to quantify how smarter AI can be controlled by dumber AI and humans via nested \"scalable oversight\".",
    "source": {
      "title": "Post on X (@tegmark), 30 Apr 2025",
      "url": "https://x.com/tegmark/status/1917580821101437280",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "Rest of post (paraphrased by the fetch) gives >90% probability that a race to AGI ends in loss of control, which he calls the 'Compton constant'. Wikipedia lists >90%.",
    "verified": true
  },
  {
    "id": "lex-fridman-10-percent-2025",
    "date": "2025-06-05",
    "scope": "ai",
    "who": "Lex Fridman",
    "role": "Podcast host, MIT researcher",
    "p": 10,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I would say my p(doom) is about 10%.",
    "source": {
      "title": "Sundar Pichai: CEO of Google and Alphabet | Lex Fridman Podcast #471 (transcript)",
      "url": "https://lexfridman.com/sundar-pichai-transcript",
      "outlet": "Lex Fridman Podcast"
    },
    "note": "Said at 00:44:34 while asking Pichai. Date per Wikipedia reference; transcript page shows none.",
    "verified": true
  },
  {
    "id": "pichai-underlying-risk-high-2025",
    "date": "2025-06-05",
    "scope": "ai",
    "who": "Sundar Pichai",
    "role": "CEO, Google and Alphabet",
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I think the underlying risk is actually pretty high, but I have a lot of faith in humanity kind of rising up to meet that moment.",
    "source": {
      "title": "Sundar Pichai | Lex Fridman Podcast #471 (transcript)",
      "url": "https://lexfridman.com/sundar-pichai-transcript",
      "outlet": "Lex Fridman Podcast"
    },
    "note": "Also: 'if p(doom) is actually high, at some point, all of humanity is aligned in making sure that's not the case.'",
    "verified": true
  },
  {
    "id": "hinton-ai4-las-vegas-2025",
    "date": "2025-06-16",
    "scope": "ai",
    "who": "Geoffrey Hinton",
    "role": "Nobel laureate; 'godfather of AI'",
    "pLow": 10,
    "pHigh": 20,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I often say [there's a] 10% to 20% chance [for AI] to wipe us out.",
    "source": {
      "title": "AI 'godfather' Geoffrey Hinton: There's a chance that AI could displace humans",
      "url": "https://www.cnbc.com/make-it/2025/06/17/ai-godfather-geoffrey-hinton-theres-a-chance-that-ai-could-displace-humans.html",
      "outlet": "CNBC Make It (2025-06-17)"
    },
    "note": "Said on The Diary of a CEO podcast, 16 Jun 2025, as quoted by CNBC. Coverage of his Ai4 talk in Las Vegas (12 Aug 2025) repeats this figure as something he 'has warned in the past', not as words spoken there.",
    "verified": true
  },
  {
    "id": "ben-mann-0-10-2025",
    "date": "2025-07-20",
    "scope": "ai",
    "who": "Benjamin Mann",
    "role": "Co-founder, Anthropic",
    "pLow": 0,
    "pHigh": 10,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "My best granularity of forecast for like could we have an X-risk or extremely bad outcome from AI is somewhere between 0 and 10%.",
    "source": {
      "title": "Anthropic co-founder: AGI predictions, leaving OpenAI, what keeps him up at night (caption transcript)",
      "url": "https://rosetta.to/u/lennyspodcast/anthropic-co-founder-agi-predictions-leaving-openai-what-keeps-him-up-at-night-b",
      "outlet": "Lenny's Podcast, via Rosetta captions"
    },
    "note": "Auto-caption transcript, corroborated by a second caption transcript; Lenny's official transcript is paywalled. Earlier in the episode: 'things are like overwhelmingly likely to go well. But on the margin almost nobody is looking at the downside risk and the downside risk is very large.'",
    "verified": true
  },
  {
    "id": "zvi-70-percent-2025",
    "date": "2025-09-06",
    "scope": "ai",
    "who": "Zvi Mowshowitz",
    "role": "Writer, Don't Worry About the Vase",
    "p": 70,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "More higher than down from previous assessment, but not enough to move to 0.8, certainly.",
    "source": {
      "title": "Zvi Mowshowitz on Longer Timelines, RL-induced Doom, and Why China is Refusing H20s",
      "url": "https://www.cognitiverevolution.ai/zvi-mowshowitz-on-longer-timelines-rl-induced-doom-and-why-china-is-refusing-h20s/",
      "outlet": "The Cognitive Revolution"
    },
    "note": "Host Nathan Labenz: 'I believe your p(doom) was 70%.' Zvi agrees it moved slightly up, 'I don't think it changed substantially, though.'",
    "verified": true
  },
  {
    "id": "yudkowsky-soares-if-anyone-builds-it-2025",
    "date": "2025-09-16",
    "scope": "ai",
    "who": "Eliezer Yudkowsky and Nate Soares",
    "role": "Machine Intelligence Research Institute",
    "horizon": "if superintelligence is built",
    "type": "book",
    "quote": "If Anyone Builds It, Everyone Dies",
    "source": {
      "title": "If Anyone Builds It, Everyone Dies (Wikipedia)",
      "url": "https://en.wikipedia.org/wiki/If_Anyone_Builds_It,_Everyone_Dies",
      "outlet": "Wikipedia"
    },
    "note": "Little, Brown, 16 Sept 2025. The quote is the title. The book's website refused automated requests, so no sentence from the text was read. MIRI's own position page says: 'if researchers build superintelligent AI with anything like the field's current technical understanding or methods, the expected outcome is human extinction.'",
    "verified": false
  },
  {
    "id": "amodei-axios-25-percent-2025",
    "date": "2025-09-17",
    "scope": "ai",
    "who": "Dario Amodei",
    "role": "CEO, Anthropic",
    "p": 25,
    "horizon": "unspecified",
    "type": "interview",
    "quote": "I'm relatively an optimist, so I think there's a 25% chance that things go really, really badly.",
    "source": {
      "title": "25% Chance That Things Could Go Really Badly With AI: Anthropic CEO Dario Amodei",
      "url": "https://officechai.com/ai/25-chance-that-things-could-go-really-badly-with-ai-anthropic-ceo-dario-amodei",
      "outlet": "OfficeChai (2025-09-18), reporting Axios AI+ DC Summit"
    },
    "note": "Sentence continues with a 75% chance things go 'really, really well'. Axios original (headline: 'There's a 25% chance that things go really, really badly') blocked.",
    "verified": true
  },
  {
    "id": "fli-statement-on-superintelligence-2025",
    "date": "2025-10-22",
    "scope": "ai",
    "who": "Future of Life Institute and signatories (Hinton, Bengio, Russell, Wozniak, Branson, Wilczek, Harari and others)",
    "role": "Open statement",
    "horizon": "unspecified",
    "type": "statement",
    "quote": "We call for a prohibition on the development of superintelligence, not lifted before there is 1) broad scientific consensus that it will be done safely and controllably, and 2) strong public buy-in.",
    "source": {
      "title": "Statement on Superintelligence",
      "url": "https://superintelligence-statement.org/",
      "outlet": "Future of Life Institute"
    },
    "note": "78,057 signatures shown. Launch date 22 Oct 2025 per Bloomberg/SiliconAngle headlines; FLI's press-release page carries a 2026-03-27 date (conflict). Statement page itself undated.",
    "verified": true
  },
  {
    "id": "russell-russian-roulette-2026",
    "date": "2026-02-18",
    "scope": "ai",
    "who": "Stuart Russell",
    "role": "Computer scientist, UC Berkeley; author of Human Compatible",
    "horizon": "unspecified",
    "type": "interview",
    "quote": "For governments to allow private entities to essentially play Russian roulette with every human being on earth",
    "source": {
      "title": "AI 'arms race' risks human extinction, warns top computing expert",
      "url": "https://www.brecorder.com/news/amp/40407773",
      "outlet": "Business Recorder (AFP)"
    },
    "note": "Also: 'AI systems themselves taking control and human civilisation being collatoral damage in that process' (sic). Gives no number.",
    "verified": true
  },
  {
    "id": "lecun-asteroid-2026",
    "date": "2026-04-21",
    "scope": "ai",
    "who": "Yann LeCun",
    "role": "Turing Award winner; former chief AI scientist, Meta",
    "horizon": "unspecified",
    "type": "statement",
    "quote": "Since everyone insists on pulling numbers out of thin air, I can play that game too: p(doom) is smaller than the probability of an extinction-level asteroid hitting the earth in the next millennium (we also have some agency on that). It's certainly a hell of a lot less likely than a nuclear Holocaust.",
    "source": {
      "title": "Post on X (@ylecun), 21 Apr 2026",
      "url": "https://x.com/ylecun/status/2046577402264870958",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "His own words, no number. Earlier in the post: 'I didn't say p(doom) was zero. I said: 1. All estimates are pulled out of thin air 2. It makes little sense to attribute a probability to an event on which we have agency.'",
    "verified": true
  },
  {
    "id": "sanders-quotes-hinton-2026",
    "date": "2026-04-25",
    "scope": "ai",
    "who": "Bernie Sanders",
    "role": "US Senator (Vermont)",
    "pLow": 10,
    "pHigh": 20,
    "horizon": "unspecified",
    "type": "statement",
    "quote": "Geoffrey Hinton, the Nobel Prize-winning \"godfather of AI,\" says there is a \"10% to 20% chance [for AI] to wipe us out.\"",
    "source": {
      "title": "Post on X (@SenSanders), 25 Apr 2026: The existential risk of artificial intelligence",
      "url": "https://x.com/SenSanders/status/2048107882760085618",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "The post is an image of text; read from the image. Sanders quotes Hinton's Diary of a CEO line as CNBC rendered it, and announces the 29 Apr 2026 Capitol discussion with US and Chinese scientists.",
    "verified": true
  },
  {
    "id": "hinton-discoveryx-under-15-2026",
    "date": "2026-04-30",
    "scope": "ai",
    "who": "Geoffrey Hinton",
    "role": "Nobel laureate; 'godfather of AI'",
    "pHigh": 15,
    "horizon": "unspecified",
    "type": "talk",
    "quote": "optimistically",
    "source": {
      "title": "AI godfather Geoffrey Hinton says we must convince AI that it's our mother",
      "url": "https://betakit.com/ai-godfather-geoffrey-hinton-says-we-must-convince-ai-that-its-our-mother/",
      "outlet": "BetaKit (2026-05-01)"
    },
    "note": "Q&A at Ontario Centre of Innovation's DiscoveryX, Toronto. BetaKit paraphrases: he 'optimistically' believes the risk is less than 15 percent, having previously estimated 10-20% over 30 years. No verbatim sentence for the number.",
    "verified": true
  },
  {
    "id": "coxon-resigns-anthropic-2026",
    "date": "2026-09-08",
    "scope": "ai",
    "who": "Jacob Coxon",
    "role": "Pretraining researcher, Anthropic (ex-OpenAI); resigned",
    "horizon": "unspecified",
    "type": "statement",
    "quote": "They are racing straight to self-improving superintelligence and gambling with our lives.",
    "source": {
      "title": "An Anthropic researcher quit saying AI labs are gambling with our lives",
      "url": "https://thenextweb.com/news/anthropic-coxon-resignation-hubinger-alignment",
      "outlet": "The Next Web (2026-09-09)"
    },
    "note": "Announced on X; also 'Neither company is acting responsibly'. Wikipedia quotes him on 'the next year or two is crunch time for humanity' (not read in TNW).",
    "verified": true
  },
  {
    "id": "hubinger-over-10-percent-decade-2026",
    "date": "2026-09-09",
    "scope": "ai",
    "who": "Evan Hubinger",
    "role": "Alignment science lead, Anthropic",
    "pLow": 10,
    "horizon": "within the next decade",
    "type": "forum",
    "quote": "Jacob is correct here; we really do earnestly believe AI could kill all humans! I personally think it is >10% within the next decade.",
    "source": {
      "title": "An Anthropic researcher quit saying AI labs are gambling with our lives",
      "url": "https://thenextweb.com/news/anthropic-coxon-resignation-hubinger-alignment",
      "outlet": "The Next Web, quoting his X post"
    },
    "note": "Also: 'we do not yet have a plan to solve alignment for superintelligence and are not clearly on track to.' CNBC 2026-09-09 blocked. Hubinger did not resign.",
    "verified": true
  },
  {
    "id": "amodei-cnn-agrees-with-coxon-2026",
    "date": "2026-09-13",
    "scope": "ai",
    "who": "Dario Amodei",
    "role": "CEO, Anthropic",
    "horizon": "this decade",
    "type": "interview",
    "quote": "I agree with Jacob much more than I disagree with him",
    "source": {
      "title": "Anthropic CEO Dario Amodei Tells CNN's Anderson Cooper He Fears AI Could Threaten Humanity This Decade",
      "url": "https://www.ibtimes.com.au/anthropic-ceo-amodei-ai-humanity-risk-warning-1875460",
      "outlet": "IBTimes Australia"
    },
    "note": "Declines a single number (a fixed percentage sounds like 'a roll of the dice'); 'If we take the right paths, then the chance of something going wrong is very low.'",
    "verified": true
  },
  {
    "id": "jensen-huang-zero-percent-2026",
    "date": "2026-09-21",
    "scope": "ai",
    "who": "Jensen Huang",
    "role": "CEO, Nvidia",
    "p": 0,
    "horizon": "by 2030",
    "type": "interview",
    "quote": "Scaring people is unnecessary. It is irresponsible.",
    "source": {
      "title": "Nvidia's Jensen Huang rejects AI doomsday fears: '2030 is not going to be the end of the world'",
      "url": "https://www.foxbusiness.com/technology/nvidias-jensen-huang-rejects-ai-doomsday-fears-2030-not-going-end-world",
      "outlet": "Fox Business, reporting CBS News interview"
    },
    "note": "Said there is '0% chance' that 2030 will be 'the end of the world'; called Coxon's predictions 'not grounded in science'. CBS interview aired ~20 Sept 2026.",
    "verified": true
  },
  {
    "id": "geoffrey-irving-coin-flip-2026",
    "date": "2026-10-15",
    "scope": "ai",
    "who": "Geoffrey Irving",
    "role": "Chief scientist, UK AI Security Institute; ex-DeepMind/OpenAI",
    "p": 50,
    "horizon": "unspecified",
    "type": "forum",
    "quote": "First, to emphasize the headline: in my view we have about a coin-flip chance that everyone dies",
    "source": {
      "title": "Post on X (@geoffreyirving), 15 Oct 2026",
      "url": "https://x.com/geoffreyirving/status/2110761297688346776",
      "outlet": "X (read via api.fxtwitter.com)"
    },
    "note": "Links to a TIME article; risk attributed to superintelligent AI.",
    "verified": true
  },
  {
    "id": "metaculus-human-extinction-2100-2026",
    "date": "2026-10-31",
    "scope": "any",
    "who": "Metaculus community",
    "role": "Forecasting platform, question 578",
    "p": 2.9,
    "horizon": "by 2100",
    "type": "market",
    "quote": "Will humans go extinct before 2100? 2.9% chance · 1.7k forecasters",
    "source": {
      "title": "Will humans go extinct before 2100? (question 578, embed view)",
      "url": "https://www.metaculus.com/questions/embed/578/",
      "outlet": "Metaculus"
    },
    "note": "Live community prediction read on 31 Oct 2026. The question page and API refuse unauthenticated requests; the embed view shows the current value only.",
    "verified": true
  }
];
