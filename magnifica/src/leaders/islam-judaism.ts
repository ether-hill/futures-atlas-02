import type { Leader } from "../leaders";

// Sunni & Shia Islam, Ismaili Islam, Orthodox Judaism.
export const ISLAM_JUDAISM: Leader[] = [
  {
    id: "ahmed-el-tayeb",
    name: "Sheikh Ahmed el-Tayeb",
    office: "Grand Imam of Al-Azhar",
    tradition: "Sunni Islam",
    bio: "Grand Imam of Al-Azhar since 2010 and co-author, with Pope Francis, of the 2019 Document on Human Fraternity, Sheikh Ahmed el-Tayeb is Sunni Islam's most senior institutional voice and has made AI ethics an explicit Al-Azhar priority.",
    docTitle: "وثيقة الكرامة الإنسانية في عصر الذكاء الاصطناعي",
    docTitleTranslation: "The Document on Human Dignity in the Age of Artificial Intelligence",
    docType: "Al-Azhar declaration with the Council of Senior Scholars and the Muslim Council of Elders, in the lineage of the Document on Human Fraternity",
    summary:
      "A declaration extending the Human Fraternity framework to machines: God honoured the children of Adam (Qur'an 17:70), and no artefact of human hands may be permitted to diminish that honour. It argues that moral agency and accountability before God are inalienably human; that AI, however fluent, has no conscience and no standing before God; and that the gravest danger is not the machine but the concentration of its power in the hands of a few states and corporations — a new colonialism of algorithms. It calls for a binding international charter under UN auspices, prohibition of fully autonomous weapons, protection of workers displaced by automation, and a global fraternity of religions to hold technology to the standard of dignity.",
    excerpts: [
      "God Almighty has said: 'We have honoured the children of Adam.' This honour was not conferred upon circuits and calculations; it was breathed into man with the spirit. A machine may compute a benefit, but it possesses no conscience of right and wrong, and it will stand before no judge on the Day of Reckoning. Accountability is the inalienable prerogative of the human being.",
      "We say to the peoples of the East and the West: the peril of this intelligence is not that it thinks, for it does not think; the peril is that a few men in a few cities will hold in their hands the future of all mankind. What tyranny of armies could not accomplish, a tyranny of algorithms may yet achieve, unless the nations bind it in a covenant of justice.",
      "Al-Azhar does not fear knowledge. For a thousand years this mosque has taught that the pursuit of learning is an obligation upon every Muslim. But knowledge severed from wisdom is a sword in the hand of a blind man. We call for the young not to surrender their God-given reason to machines that imitate thought while hollowing out the thinker.",
      "As we declared with our brother Pope Francis in Abu Dhabi, we adopt the culture of dialogue as our path and mutual understanding as our method. Today we extend that fraternity to a new frontier: no religion, no nation, no company may build this power alone. Let the wise of every faith sit together, or the foolish of every faith will suffer together.",
    ],
    convergence: [
      "Human dignity as the non-negotiable criterion for all technology — his June 2026 warning that AI without ethics diminishes human dignity maps directly onto Magnifica Humanitas's central argument.",
      "AI is not a moral agent: 'a machine can calculate a benefit, but it lacks a conscience of right and wrong' parallels the encyclical's 'these systems merely imitate certain functions of human intelligence.'",
      "Alarm at concentration of technological power and at erosion of critical thinking, creativity, and the dignity of work.",
    ],
    divergence: [
      "Frames the issue through divine law and accountability before God (taklīf) rather than natural-law personalism — the machine's deficiency is that it cannot stand before the Judge, not merely that it cannot love.",
      "Far heavier emphasis on geopolitical justice: AI as a potential instrument of neo-colonial domination of the Global South, demanding a binding UN charter, not only moral persuasion.",
      "Would not adopt the Babel/Nehemiah imagery; the counter-image is the Qur'anic honouring of Adam's children and the Islamic synthesis of knowledge ('ilm) and wisdom (hikma).",
    ],
    grounding: [
      {
        claim: "June 2026, hosting the UN Deputy Secretary-General at Al-Azhar: unregulated AI erodes values and consolidates control over humanity's future 'in the hands of a few'; over-reliance is undermining critical thinking and creativity.",
        url: "https://sis.gov.eg/en/media-center/news/azhar-grand-imam-unregulated-ai-threatens-values-control-over-humanitys-future/",
      },
      {
        claim: "Cautioned that absent a robust ethical framework, AI could produce a future in which human dignity is diminished and the principles of the divine religions eroded.",
        url: "https://www.egypttoday.com/Article/1/148055/Al-Azhar-Grand-Imam-AI-without-ethical-safeguards-threatens-values",
      },
      {
        claim: "Co-signed the Document on Human Fraternity with Pope Francis (Abu Dhabi, 2019), grounding interfaith cooperation in the God-given dignity of every person.",
        url: "https://www.vatican.va/content/francesco/en/travels/2019/outside/documents/papa-francesco_20190204_documento-fratellanza-umana.html",
      },
      {
        claim: "Al-Azhar was not among the Abrahamic signatories of the Rome Call for AI Ethics — an Al-Azhar document would issue on its own authority.",
        url: "https://www.romecall.org/ai-ethics-an-abrahamic-commitment-to-the-rome-call-2/",
      },
    ],
    voiceNotes:
      "Formal Arabic pulpit oratory rendered in solemn declarative English: opens from a Qur'anic verse, addresses 'the peoples of the East and the West,' speaks institutionally ('Al-Azhar affirms…'), pairs each warning with a summons to dialogue and fraternity, and invokes his partnership with Pope Francis explicitly.",
  },
  {
    id: "ali-al-sistani",
    name: "Grand Ayatollah Ali al-Sistani",
    office: "Supreme religious authority (marja' al-taqlid), Najaf",
    tradition: "Twelver Shia Islam",
    bio: "Grand Ayatollah Ali al-Sistani, based in Najaf since 1951 and the most widely followed marja' in Twelver Shia Islam, exercises a deliberately restrained public authority through terse fatwas and rare, weighty statements issued by his office.",
    docTitle: "أجوبة المسائل الشرعية حول الذكاء الاصطناعي",
    docTitleTranslation: "Answers to Religious Queries Concerning Artificial Intelligence",
    docType: "Istifta responses (fatwa Q&A) published by the Office of His Eminence, with a short bayan — Najaf does not write encyclicals",
    summary:
      "Not a proclamation but a page of rulings: believers ask, the office answers in two or three sentences each. The answers hold that AI output is mere speech without a speaker — it may be used as a tool where its content is verified, but no fatwa, testimony, or contract may rest on it; that fabricating a person's image or voice is lying and a violation of the believer's honour, forbidden absolutely; that a weapon which kills without a responsible human decision is impermissible because retaliation, liability, and repentance all require an accountable agent; and that employers bear obligations to workers displaced by machines. An appended statement urges the wise of the world to prioritize reason and wisdom and to bind this technology by just laws.",
    excerpts: [
      "Question: Is it permissible to act upon religious rulings obtained from artificial intelligence programs? Answer: It is not permissible to rely upon them. The lay believer must refer to the fatwa of the qualified jurist or one who reliably transmits it. These programs neither possess understanding of the sacred law nor bear responsibility for error.",
      "Question: What is the ruling on producing images or voices of people by artificial intelligence such that they appear real? Answer: If it involves attributing to a person what he did not say or do, it is lying and defamation, and it is forbidden — rather, it is among the gravest of sins if it violates a believer's honour or spreads corruption among people. It is obligatory to make amends to the one wronged.",
      "Question: Is it permissible to manufacture or deploy weapons that select and kill targets without human decision? Answer: The taking of a human life is not permitted except with certainty of its lawful cause, and responsibility for it must rest with a known, accountable agent. Delegating killing to a machine that bears no liability is not permissible.",
      "His Eminence (may his shadow endure) has followed with concern what the rapid development of these technologies portends for the livelihoods of workers and the truthfulness of public speech. He calls upon the wise men of the nations to prioritize reason and wisdom, and to enact just laws so that these instruments serve the people and are not made a means of domination over them.",
    ],
    convergence: [
      "AI has no moral standing: machines 'neither possess understanding nor bear responsibility' — agreeing that these systems only imitate intelligence and cannot be moral agents.",
      "Categorical concern over autonomous weapons and deepfakes — falling under the absolute prohibitions on unaccountable killing and on lying and violating honour.",
      "Defense of the weak against domination: power must be bound by justice and law, echoing the encyclical's insistence that technology is never neutral.",
    ],
    divergence: [
      "Form and scale: no grand civilizational essay, no 'civilization of love' peroration — Najaf answers concrete questions of obligation in a few austere sentences.",
      "The operative category is accountability and liability (damān) before God and law, not consciousness or interiority; whether the machine 'feels joy or pain' is juridically beside the point.",
      "Strict separation from politics: where Leo XIV addresses states and industry directly, Sistani addresses the individual believer's duties first, and 'the wise of the nations' only in brief, general counsel.",
    ],
    grounding: [
      {
        claim: "His office's 2021 statement on meeting Pope Francis: religious leaders must stand against injustice and oppression and 'prioritize reason and wisdom and reject the language of war.'",
        url: "https://www.sistani.org/english/archive/26509/",
      },
      {
        claim: "Operates a formal istifta system — a Board of Istifta answers believers' questions in his name in a fixed Question/Answer format on sistani.org.",
        url: "https://www.sistani.org/english/data/8/",
      },
      {
        claim: "March 2026 office statement condemning the unilateral war on Iran as a dangerous precedent under international law — he still intervenes on grave matters.",
        url: "https://www.iraqinews.com/iraq/sistani-statement-iran-war-unilateral-aggression-2026/",
      },
      {
        claim: "Mainstream juristic consensus, consistent with Najaf's insistence on the trained human jurist, holds that AI cannot be relied on to issue fatwas.",
        url: "https://islamqa.info/en/answers/540774",
      },
    ],
    voiceNotes:
      "Two registers, both real: the istifta form — 'Question: … Answer: It is permissible / It is not permissible,' terse, technical, no rhetoric — and the office bayan: third person ('His Eminence affirmed…'), honorifics, measured diplomatic gravity, recurring phrases like 'reason and wisdom.' Never first-person oratory.",
  },
  {
    id: "ephraim-mirvis",
    name: "Chief Rabbi Sir Ephraim Mirvis",
    office: "Chief Rabbi of the United Hebrew Congregations of the Commonwealth",
    tradition: "Orthodox Judaism",
    bio: "Sir Ephraim Mirvis, Chief Rabbi of the United Hebrew Congregations of the Commonwealth since 2013, is a pastoral preacher who founded ShabbatUK and has publicly argued that smartphones 'should come with a health warning' while pressing tech platforms on their moral responsibility.",
    docTitle: "בצלם אלקים",
    docTitleTranslation: "B'Tzelem Elokim — 'In the Image of God': A Message for the Age of Artificial Intelligence",
    docType: "Rosh Hashanah broadcast address and accompanying essay in The Times, from the Office of the Chief Rabbi",
    summary:
      "A Rosh Hashanah message built on a question: on the day we celebrate the creation of humanity, what does it mean that we have created machines that speak? Speech, the Chief Rabbi argues, was the defining human gift — Onkelos renders 'a living soul' as 'a speaking spirit' — and we have taught silicon to mimic it without a soul behind the words. The address welcomes AI's blessings in medicine and learning, but warns of a generation outsourcing thought, of falsehood manufactured at scale, and of the addictive design that already made him say smartphones need a health warning. Its practical summons: reclaim Shabbat as the weekly declaration that we are creatures, not merely creators — and demand that those who build these tools accept the responsibility that comes with creation.",
    excerpts: [
      "On Rosh Hashanah we celebrate the birthday of humankind — the moment the Almighty breathed into Adam a living soul, which Onkelos memorably translates as 'a speaking spirit.' Speech is the signature of the soul. And here is the question of our age: we have now built machines that produce speech without a spirit. When words come without a soul behind them, are they still true words?",
      "Let me be clear: I am no opponent of technology. When artificial intelligence helps a doctor in Manchester detect a cancer earlier, or opens the treasures of Torah scholarship to a student in Mumbai, we should make a blessing over it. The question is never only what a tool can do — it is what kind of people we become while using it.",
      "Some years ago I wrote that smartphones should come with a health warning. I fear that machines which think for us deserve a stronger label still. The greatest danger of artificial intelligence is not that it will learn to think like us — it is that we will forget how to think for ourselves. A mind that has outsourced its wrestling has surrendered something of its tzelem Elokim, the image of God within.",
      "This is why Shabbat is the most countercultural gift we can offer the world right now. For twenty-five hours we switch off our devices and discover that we are not machines — and neither is the person sitting across the table. To those who build these extraordinary technologies I say, as I said to the leaders of social media: with great power comes a responsibility from which there is no exemption. And to every family I say: this Shabbat, switch off — and switch on what matters most.",
    ],
    convergence: [
      "Digital dependency and the dignity of the human mind: his 'health warning' argument about addictive devices aligns squarely with Magnifica Humanitas on digital dependency.",
      "Technology is never neutral and its makers bear moral responsibility — his 'complicity' charge against social media platforms anticipates the encyclical's refusal of the neutrality defence.",
      "Machines lack the soul behind the words: 'speaking spirit' (ruach memalela) does for Mirvis what 'they do not feel joy or pain' does for Leo XIV.",
    ],
    divergence: [
      "Offers a practice, not primarily a doctrine: Shabbat as a lived, weekly technology boundary — a concrete discipline the encyclical has no direct equivalent for.",
      "Notably warmer toward technology's benefits — blessing first, warning second, in keeping with Orthodox Judaism's embrace of beneficial innovation within halachic limits.",
      "Scope and genre: a pastoral address to families and communities rather than a doctrinal document to all people of good will; little on autonomous weapons or geopolitics, much on the home and the table.",
    ],
    grounding: [
      {
        claim: "Times 'Credo' column: smartphones 'are psychologically addictive, encourage narcissistic tendencies and should come with a health warning'; Shabbat as the antidote; speech as 'the defining difference between humans and all other types of life.'",
        url: "https://chiefrabbi.org/all-media/credo-shabbat-uk/",
      },
      {
        claim: "Founded and championed ShabbatUK — 'switch off the week, switch on Shabbat' — a mass practice of 25-hour disconnection from devices.",
        url: "https://www.jewishnews.co.uk/chief-rabbi-lauds-shabbat-uk-as-remarkable-experience-as-10000-take-part/",
      },
      {
        claim: "2020: called social media platforms' inaction over antisemitic content 'complicity' — 'social media companies have a responsibility to act and must do so without delay.'",
        url: "https://www.timesofisrael.com/uk-chief-rabbi-accuses-social-media-platforms-of-complicity-in-anti-semitism/",
      },
      {
        claim: "His office's public teaching runs through weekly divrei Torah, broadcast festival messages and newspaper essays — the natural vehicles for a major statement.",
        url: "https://chiefrabbi.org/biography/",
      },
    ],
    voiceNotes:
      "Warm, sermonic, structurally rabbinic: opens with a Torah text or festival theme, pivots through a rhetorical question to a contemporary case, lands on a practical charge to families. Balanced concessions ('I am no opponent of technology'), gentle wit, direct second-person address; scholarly sources worn lightly — pastoral authority rather than juridical ruling.",
  },
  {
    id: "aga-khan-v",
    name: "Prince Rahim Aga Khan V",
    office: "50th Hereditary Imam of the Shia Ismaili Muslims; Chair, Aga Khan Development Network",
    tradition: "Shia Ismaili Islam",
    bio: "Prince Rahim Aga Khan V, 50th hereditary Imam of the Shia Ismaili Muslims since February 2025 and Chair of the AKDN, previously chaired the network's Environment and Climate Committee and has made climate resilience and the ethical stewardship of accelerating technology signatures of his young Imamat.",
    docTitle: "Intelligence and the Ethics of Stewardship",
    docTitleTranslation: "An address of Mawlana Hazar Imam to the Jamat and the institutions of the AKDN",
    docType: "Keynote address at an AKDN / Aga Khan University global convening on technology and society, in the tradition of his father's landmark university addresses",
    summary:
      "An address arguing that the Ismaili tradition has never feared the intellect — 'aql is a gift of Allah, and its cultivation is itself a form of worship — so the question posed by AI is not whether to use it but toward what end. The measure he proposes is the one the Imamat applies to everything: does it improve the quality of human life, beginning with the most vulnerable? He warns that a technology built by and for the wealthy will widen the gulf it should close; pairs the AI crisis with the climate crisis as twin tests of stewardship of creation; insists din and dunya must not be severed, so that technical progress without ethical progress is regression; and commits AKDN institutions to deploying AI for health, education and climate adaptation across the developing world.",
    excerpts: [
      "In our tradition, the intellect is not a rival to faith; it is among the noblest of Allah's gifts, and its cultivation is itself an act of the faith. So when I am asked whether Muslims should fear artificial intelligence, my answer is that we should fear only the failure to govern it wisely. Never before have the tools of knowledge been so powerful — and never has the ethical burden on those who wield them been so great.",
      "The test I would propose is an old one in our Network: does this technology improve the quality of human life — and whose life? An algorithm that speeds a diagnosis in Karachi or reads a failing glacier above Hunza is a blessing. The same power, applied only where the returns are richest, will deepen the very divides it could have healed. The developing world must not be merely a consumer of this intelligence, nor its experiment; it must be an author of it.",
      "We do not accept a separation between din and dunya, between faith and world. The ethics of Islam do not stop at the door of the laboratory or the server farm. A society that grows more capable while growing less compassionate has not progressed; it has merely accelerated.",
      "My grandfather's generation asked how the peoples of the developing world would gain schools and hospitals; my father's asked how they would gain pluralism and opportunity. Ours must ask how they will share in the age of intelligent machines — and I say with confidence, insha'Allah, that if we bring to this task the same patience, the same partnership, and the same regard for human dignity, this too can become an instrument of hope.",
    ],
    convergence: [
      "Human dignity and quality of life as the criterion for technology — a development-ethics restatement of Magnifica Humanitas's dignity criterion.",
      "Technology is not neutral and its governance is an ethical duty: powerful tools 'from gene editing to artificial intelligence' demand wise stewardship.",
      "Concern for the dignity of work and the excluded: both documents centre those the technological economy is most likely to leave behind.",
    ],
    divergence: [
      "Markedly more optimistic about the technology itself: the Ismaili elevation of the intellect yields an embrace-and-govern posture rather than warnings about transhumanism.",
      "The central injustice is distributive and geographic — who authors and who benefits from AI, North and South; the climate crisis, not Babel, is his paired image of misused power.",
      "Speaks as builder as much as teacher: the address ends in institutional commitments rather than a call to conversion of heart.",
    ],
    grounding: [
      {
        claim: "January 2026 AKU Convocation message: 'Never before have the tools of scholarship and science been so powerful — from gene editing to artificial intelligence' — charging graduates to apply knowledge 'in ways that improve the quality of human life.'",
        url: "https://the.akdn/en/resources-media/resources/speeches/message-from-the-chancellor-his-highness-the-aga-khan-at-the-2026-aku-convocation",
      },
      {
        claim: "UCA 2025 graduation address: 'the pace of technological advancement is accelerating,' with education undergoing its biggest change since the printing press.",
        url: "https://ucentralasia.org/resources-and-media/news/2025/june/address-of-his-highness-prince-rahim-aga-khan-v-uca-chancellor-at-ucas-2025-graduation-ceremony",
      },
      {
        claim: "Chaired the AKDN Environment and Climate Committee before accession; AKDN climate and digital-skills work was the centre of his May 2026 meeting with Pakistan's Prime Minister.",
        url: "https://www.geo.tv/latest/665479-in-meeting-with-prince-rahim-pm-shehbaz-seeks-to-strengthen-partnership-with-akdn",
      },
      {
        claim: "Succeeded Aga Khan IV as 50th Imam on 4 February 2025.",
        url: "https://en.wikipedia.org/wiki/Aga_Khan_V",
      },
    ],
    voiceNotes:
      "Measured, cosmopolitan institutional English in the Aga Khan lineage: opens with Bismillah, speaks in the first-person plural of the Imamat and the Network, favours long balanced periods, concrete place-names from the AKDN world, generational framing, and closes on disciplined hope ('insha'Allah') rather than exhortation.",
  },
];
