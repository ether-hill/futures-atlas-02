import type { Source } from "./types";

/**
 * Every source the project cites. `verified: true` means the link was opened
 * and author, title, year and venue were checked against it (DOIs against
 * their Crossref record). Anything not yet checked carries a `todo` and says
 * so on /sources. A source nothing cites fails the integrity check, so this
 * list is exactly the bibliography.
 */
export const SOURCES: Source[] = [
  {
    "id": "debroglie-1925",
    "citation": "de Broglie, L. (1925). Recherches sur la théorie des quanta. Annales de Physique, 10e série, 3, 22–128. (Doctoral thesis, Faculté des Sciences, Université de Paris, 1924.)",
    "url": "https://doi.org/10.1051/anphys/192510030022",
    "verified": true
  },
  {
    "id": "nobel-debroglie-bio",
    "citation": "Nobel Foundation. Louis de Broglie – Biographical. NobelPrize.org (from Nobel Lectures, Physics 1922–1941).",
    "url": "https://www.nobelprize.org/prizes/physics/1929/broglie/biographical/",
    "verified": true
  },
  {
    "id": "nobel-physics-1929",
    "citation": "Nobel Foundation. The Nobel Prize in Physics 1929. NobelPrize.org.",
    "url": "https://www.nobelprize.org/prizes/physics/1929/summary/",
    "verified": true
  },
  {
    "id": "schrodinger-1926",
    "citation": "Schrödinger, E. (1926). Quantisierung als Eigenwertproblem (Erste Mitteilung). Annalen der Physik, 384(4), 361–376.",
    "url": "https://doi.org/10.1002/andp.19263840404",
    "verified": true
  },
  {
    "id": "hyperphysics-particle-box",
    "citation": "Nave, R. Particle in a Box. HyperPhysics, Department of Physics and Astronomy, Georgia State University.",
    "url": "http://hyperphysics.phy-astr.gsu.edu/hbase/quantum/pbox.html",
    "verified": true
  },
  {
    "id": "hyperphysics-standing-waves",
    "citation": "Nave, R. Standing Waves. HyperPhysics, Department of Physics and Astronomy, Georgia State University.",
    "url": "http://hyperphysics.phy-astr.gsu.edu/hbase/Waves/standw.html",
    "verified": true
  },
  {
    "id": "hyperphysics-hydrogen",
    "citation": "Nave, R. The Hydrogen Atom (Hydrogen Schrödinger Equation). HyperPhysics, Department of Physics and Astronomy, Georgia State University.",
    "url": "http://hyperphysics.phy-astr.gsu.edu/hbase/quantum/hydsch.html",
    "verified": true
  },
  {
    "id": "hyperphysics-debroglie",
    "citation": "Nave, R. Wave Nature of Electron. HyperPhysics, Department of Physics and Astronomy, Georgia State University.",
    "url": "http://hyperphysics.phy-astr.gsu.edu/hbase/debrog.html",
    "verified": true
  },
  {
    "id": "bacciagaluppi-valentini-2009",
    "citation": "Bacciagaluppi, G., & Valentini, A. (2009). Quantum Theory at the Crossroads: Reconsidering the 1927 Solvay Conference. Cambridge University Press.",
    "url": "https://doi.org/10.1017/CBO9781139194983",
    "openAccessUrl": "https://arxiv.org/abs/quant-ph/0609184",
    "verified": true
  },
  {
    "id": "sep-bohmian-mechanics",
    "citation": "Goldstein, S. Bohmian Mechanics. In E. N. Zalta & U. Nodelman (Eds.), The Stanford Encyclopedia of Philosophy (current revision).",
    "url": "https://plato.stanford.edu/entries/qm-bohm/",
    "verified": true
  },
  {
    "id": "bohm-1952a",
    "citation": "Bohm, D. (1952). A Suggested Interpretation of the Quantum Theory in Terms of \"Hidden\" Variables. I. Physical Review, 85(2), 166–179.",
    "url": "https://doi.org/10.1103/PhysRev.85.166",
    "verified": true
  },
  {
    "id": "bohm-1952b",
    "citation": "Bohm, D. (1952). A Suggested Interpretation of the Quantum Theory in Terms of \"Hidden\" Variables. II. Physical Review, 85(2), 180–193.",
    "url": "https://doi.org/10.1103/PhysRev.85.180",
    "verified": true
  },
  {
    "id": "aharonov-bohm-1959",
    "citation": "Aharonov, Y., & Bohm, D. (1959). Significance of Electromagnetic Potentials in the Quantum Theory. Physical Review, 115(3), 485–491.",
    "url": "https://doi.org/10.1103/PhysRev.115.485",
    "verified": true
  },
  {
    "id": "hiley-1997",
    "citation": "Hiley, B. J. (1997). David Joseph Bohm. 20 December 1917 – 27 October 1992. Biographical Memoirs of Fellows of the Royal Society, 43, 107–131.",
    "url": "https://doi.org/10.1098/rsbm.1997.0007",
    "verified": true
  },
  {
    "id": "bell-1964",
    "citation": "Bell, J. S. (1964). On the Einstein Podolsky Rosen paradox. Physics Physique Fizika, 1(3), 195–200.",
    "url": "https://doi.org/10.1103/PhysicsPhysiqueFizika.1.195",
    "verified": true
  },
  {
    "id": "heller-1984",
    "citation": "Heller, E. J. (1984). Bound-State Eigenfunctions of Classically Chaotic Hamiltonian Systems: Scars of Periodic Orbits. Physical Review Letters, 53(16), 1515–1518.",
    "url": "https://doi.org/10.1103/PhysRevLett.53.1515",
    "verified": true
  },
  {
    "id": "stockmann-stein-1990",
    "citation": "Stöckmann, H.-J., & Stein, J. (1990). \"Quantum\" chaos in billiards studied by microwave absorption. Physical Review Letters, 64(19), 2215–2218.",
    "url": "https://doi.org/10.1103/PhysRevLett.64.2215",
    "verified": true
  },
  {
    "id": "sridhar-1991",
    "citation": "Sridhar, S. (1991). Experimental observation of scarred eigenfunctions of chaotic microwave cavities. Physical Review Letters, 67(7), 785–788.",
    "url": "https://doi.org/10.1103/PhysRevLett.67.785",
    "verified": true
  },
  {
    "id": "crommie-lutz-eigler-1993",
    "citation": "Crommie, M. F., Lutz, C. P., & Eigler, D. M. (1993). Confinement of Electrons to Quantum Corrals on a Metal Surface. Science, 262(5131), 218–220.",
    "url": "https://doi.org/10.1126/science.262.5131.218",
    "verified": true
  },
  {
    "id": "manoharan-lutz-eigler-2000",
    "citation": "Manoharan, H. C., Lutz, C. P., & Eigler, D. M. (2000). Quantum mirages formed by coherent projection of electronic structure. Nature, 403(6769), 512–515.",
    "url": "https://doi.org/10.1038/35000508",
    "verified": true
  },
  {
    "id": "tonomura-1989",
    "citation": "Tonomura, A., Endo, J., Matsuda, T., Kawasaki, T., & Ezawa, H. (1989). Demonstration of single-electron buildup of an interference pattern. American Journal of Physics, 57(2), 117–120.",
    "url": "https://doi.org/10.1119/1.16104",
    "verified": true
  },
  {
    "id": "bach-2013",
    "citation": "Bach, R., Pope, D., Liou, S.-H., & Batelaan, H. (2013). Controlled double-slit electron diffraction. New Journal of Physics, 15(3), 033018.",
    "url": "https://doi.org/10.1088/1367-2630/15/3/033018",
    "openAccessUrl": "https://arxiv.org/abs/1210.6243",
    "verified": true
  },
  {
    "id": "couder-2005",
    "citation": "Couder, Y., Protière, S., Fort, E. & Boudaoud, A. (2005). Walking and orbiting droplets. Nature 437(7056), 208.",
    "url": "https://doi.org/10.1038/437208a",
    "verified": true
  },
  {
    "id": "couder-fort-2006",
    "citation": "Couder, Y. & Fort, E. (2006). Single-particle diffraction and interference at a macroscopic scale. Physical Review Letters 97(15), 154101.",
    "url": "https://doi.org/10.1103/PhysRevLett.97.154101",
    "verified": true
  },
  {
    "id": "eddi-2009",
    "citation": "Eddi, A., Fort, E., Moisy, F. & Couder, Y. (2009). Unpredictable tunneling of a classical wave-particle association. Physical Review Letters 102(24), 240401.",
    "url": "https://doi.org/10.1103/PhysRevLett.102.240401",
    "verified": true
  },
  {
    "id": "fort-2010",
    "citation": "Fort, E., Eddi, A., Boudaoud, A., Moukhtar, J. & Couder, Y. (2010). Path-memory induced quantization of classical orbits. Proceedings of the National Academy of Sciences 107(41), 17515–17520.",
    "url": "https://doi.org/10.1073/pnas.1007386107",
    "openAccessUrl": "https://arxiv.org/abs/1307.6051",
    "verified": true
  },
  {
    "id": "harris-2013",
    "citation": "Harris, D. M., Moukhtar, J., Fort, E., Couder, Y. & Bush, J. W. M. (2013). Wavelike statistics from pilot-wave dynamics in a circular corral. Physical Review E 88(1), 011001(R).",
    "url": "https://doi.org/10.1103/PhysRevE.88.011001",
    "openAccessUrl": "http://hdl.handle.net/1721.1/80700",
    "verified": true
  },
  {
    "id": "oza-2013",
    "citation": "Oza, A. U., Rosales, R. R. & Bush, J. W. M. (2013). A trajectory equation for walking droplets: hydrodynamic pilot-wave theory. Journal of Fluid Mechanics 737, 552–570.",
    "url": "https://doi.org/10.1017/jfm.2013.581",
    "openAccessUrl": "http://hdl.handle.net/1721.1/90191",
    "verified": true
  },
  {
    "id": "perrard-2014",
    "citation": "Perrard, S., Labousse, M., Miskin, M., Fort, E. & Couder, Y. (2014). Self-organization into quantized eigenstates of a classical wave-driven particle. Nature Communications 5, 3219.",
    "url": "https://doi.org/10.1038/ncomms4219",
    "openAccessUrl": "https://arxiv.org/abs/1402.1423",
    "verified": true
  },
  {
    "id": "bush-2015",
    "citation": "Bush, J. W. M. (2015). Pilot-wave hydrodynamics. Annual Review of Fluid Mechanics 47, 269–292.",
    "url": "https://doi.org/10.1146/annurev-fluid-010814-014506",
    "openAccessUrl": "https://dspace.mit.edu/handle/1721.1/89790",
    "verified": true
  },
  {
    "id": "andersen-2015",
    "citation": "Andersen, A., Madsen, J., Reichelt, C., Rosenlund Ahl, S., Lautrup, B., Ellegaard, C., Levinsen, M. T. & Bohr, T. (2015). Double-slit experiment with single wave-driven particles and its relation to quantum mechanics. Physical Review E 92(1), 013006.",
    "url": "https://doi.org/10.1103/PhysRevE.92.013006",
    "verified": true
  },
  {
    "id": "batelaan-2016",
    "citation": "Batelaan, H., Jones, E., Huang, W. C.-W. & Bach, R. (2016). Momentum exchange in the electron double-slit experiment. Journal of Physics: Conference Series 701, 012007 (EmQM15).",
    "url": "https://doi.org/10.1088/1742-6596/701/1/012007",
    "openAccessUrl": "https://iopscience.iop.org/article/10.1088/1742-6596/701/1/012007/pdf",
    "verified": true
  },
  {
    "id": "pucci-2018",
    "citation": "Pucci, G., Harris, D. M., Faria, L. M. & Bush, J. W. M. (2018). Walking droplets interacting with single and double slits. Journal of Fluid Mechanics 835, 1136–1156.",
    "url": "https://doi.org/10.1017/jfm.2017.790",
    "verified": true
  },
  {
    "id": "wolchover-2018",
    "citation": "Wolchover, N. (2018, October 11). Famous experiment dooms alternative to quantum weirdness. Quanta Magazine.",
    "url": "https://www.quantamagazine.org/famous-experiment-dooms-pilot-wave-alternative-to-quantum-weirdness-20181011/",
    "verified": true
  },
  {
    "id": "saenz-2018",
    "citation": "Sáenz, P. J., Cristea-Platon, T. & Bush, J. W. M. (2018). Statistical projection effects in a hydrodynamic pilot-wave system. Nature Physics 14(3), 315–319.",
    "url": "https://doi.org/10.1038/s41567-017-0003-x",
    "openAccessUrl": "https://thales.mit.edu/bush/wp-content/uploads/2017/12/Saenz-NatPhys-2017-.pdf",
    "verified": true
  },
  {
    "id": "ellegaard-levinsen-2020",
    "citation": "Ellegaard, C. & Levinsen, M. T. (2020). Interaction of wave-driven particles with slit structures. Physical Review E 102(2), 023115.",
    "url": "https://doi.org/10.1103/PhysRevE.102.023115",
    "openAccessUrl": "https://arxiv.org/abs/2005.12335",
    "verified": true
  },
  {
    "id": "bush-oza-2021",
    "citation": "Bush, J. W. M. & Oza, A. U. (2021). Hydrodynamic quantum analogs. Reports on Progress in Physics 84(1), 017001.",
    "url": "https://doi.org/10.1088/1361-6633/abc22c",
    "openAccessUrl": "https://thales.mit.edu/bush/wp-content/uploads/2012/04/BushOza-ROPP.pdf",
    "verified": true
  },
  {
    "id": "durey-bush-2025",
    "citation": "Durey, M. & Bush, J. W. M. (2025). The energetics of pilot-wave hydrodynamics. Journal of Fluid Mechanics 1009, A4.",
    "url": "https://doi.org/10.1017/jfm.2025.168",
    "openAccessUrl": "https://eprints.gla.ac.uk/347408",
    "verified": true
  },
  {
    "id": "primkulov-2025-nonresonant",
    "citation": "Primkulov, B. K., Evans, D. J., Been, J. B. & Bush, J. W. M. (2025). Nonresonant effects in pilot-wave hydrodynamics. Physical Review Fluids 10(1), 013601.",
    "url": "https://doi.org/10.1103/PhysRevFluids.10.013601",
    "openAccessUrl": "https://arxiv.org/abs/2411.14996",
    "verified": true
  },
  {
    "id": "primkulov-2025-kapitza-dirac",
    "citation": "Primkulov, B. K., Evans, D. J., Frumkin, V., Sáenz, P. J. & Bush, J. W. M. (2025). Diffraction of walking drops by a standing Faraday wave. Physical Review Research 7(1), 013226.",
    "url": "https://doi.org/10.1103/PhysRevResearch.7.013226",
    "openAccessUrl": "https://arxiv.org/abs/2412.18936",
    "verified": true
  },
  {
    "id": "protiere-2006",
    "citation": "Protière, S., Boudaoud, A. & Couder, Y. (2006). Particle–wave association on a fluid interface. Journal of Fluid Mechanics 554, 85–108.",
    "url": "https://doi.org/10.1017/S0022112006009190",
    "verified": true
  },
  {
    "id": "papatryfonos-2022-superradiance",
    "citation": "Papatryfonos, K., Ruelle, M., Bourdiol, C., Nachbin, A., Bush, J. W. M. & Labousse, M. (2022). Hydrodynamic superradiance in wave-mediated cooperative tunneling. Communications Physics 5, 142.",
    "url": "https://doi.org/10.1038/s42005-022-00918-y",
    "openAccessUrl": "https://www.nature.com/articles/s42005-022-00918-y.pdf",
    "verified": true
  },
  {
    "id": "frumkin-2023-superradiant-emission",
    "citation": "Frumkin, V., Bush, J. W. M. & Papatryfonos, K. (2023). Superradiant droplet emission from parametrically excited cavities. Physical Review Letters 130(6), 064002.",
    "url": "https://doi.org/10.1103/PhysRevLett.130.064002",
    "openAccessUrl": "https://arxiv.org/abs/2111.04687",
    "verified": true
  },
  {
    "id": "frumkin-bush-2023",
    "citation": "Frumkin, V. & Bush, J. W. M. (2023). Misinference of interaction-free measurement from a classical system. Physical Review A 108(6), L060201.",
    "url": "https://doi.org/10.1103/PhysRevA.108.L060201",
    "openAccessUrl": "https://arxiv.org/abs/2306.13590",
    "verified": true
  },
  {
    "id": "papatryfonos-2024-bell",
    "citation": "Papatryfonos, K., Vervoort, L., Nachbin, A., Labousse, M. & Bush, J. W. M. (2024). Static Bell test in pilot-wave hydrodynamics. Physical Review Fluids 9(8), 084001.",
    "url": "https://doi.org/10.1103/PhysRevFluids.9.084001",
    "openAccessUrl": "https://arxiv.org/abs/2208.08940",
    "verified": true
  },
  {
    "id": "blitstein-2026",
    "citation": "Blitstein, A. M., Rosales, R. R. & Sáenz, P. J. (2026). Anomalous interference drives oscillatory dynamics in wave-dressed active particles. Proceedings of the Royal Society A 482, 20260008.",
    "url": "https://doi.org/10.1098/rspa.2026.0008",
    "openAccessUrl": "https://arxiv.org/abs/2504.08774",
    "verified": true
  },
  {
    "id": "rozenman-2025-ab-preprint",
    "citation": "Rozenman, G. G., McKee, K. I., Lazarus, A., Frumkin, V. & Bush, J. W. M. (2025). Observation of the Aharonov–Bohm effect in pilot-wave hydrodynamics. arXiv:2512.21263 [preprint, not peer reviewed].",
    "url": "https://arxiv.org/abs/2512.21263",
    "verified": true
  },
  {
    "id": "lopez-2026-sync-bell-preprint",
    "citation": "López, Á. G., Valani, R. N., Li, Y. & Bush, J. W. M. (2026). Synchronization induces Bell violations in a model of walking droplets. arXiv:2608.21915 [preprint, not peer reviewed].",
    "url": "https://arxiv.org/abs/2608.21915",
    "verified": true
  },
  {
    "id": "huerre-2020",
    "citation": "Huerre, P. (2020). Yves Couder (1941–2019): A life in search of the beauty of fluid motion. Comptes Rendus. Mécanique 348(6–7), 397–400.",
    "url": "https://doi.org/10.5802/crmeca.37",
    "openAccessUrl": "https://comptes-rendus.academie-sciences.fr/mecanique/articles/10.5802/crmeca.37",
    "verified": true
  },
  {
    "id": "euromech-couder",
    "citation": "EUROMECH. Yves Couder [obituary notice].",
    "url": "https://euromech.org/news/yves-couder/",
    "verified": true
  },
  {
    "id": "uva-fort-2023",
    "citation": "University of Amsterdam IoP colloquium listing: Emmanuel Fort, 28 September 2023.",
    "url": "https://iop.uva.nl/content/events/2023/09/colloquium-dima-abanin-copy-6.html",
    "verified": true
  },
  {
    "id": "usc-bush-bio",
    "citation": "USC Aerospace & Mechanical Engineering, Laufer Lecture speaker bio: John Bush.",
    "url": "https://ame.usc.edu/?p=1726",
    "verified": true
  },
  {
    "id": "dtu-bohr",
    "citation": "DTU Physics, Complex Motion in Fluids group members page.",
    "url": "https://physics.dtu.dk/research/sections/fluids/research-groups/complex-motion-in-fluids/members",
    "verified": true
  },
  {
    "id": "bohr-1998",
    "citation": "Bohr, T., Jensen, M. H., Paladin, G. & Vulpiani, A. (1998). Dynamical Systems Approach to Turbulence. Cambridge University Press.",
    "url": "https://doi.org/10.1017/CBO9780511599972",
    "verified": true
  },
  {
    "id": "douady-1990",
    "citation": "Douady, S. (1990). Experimental study of the Faraday instability. Journal of Fluid Mechanics, 221, 383–409.",
    "url": "https://doi.org/10.1017/S0022112090003603",
    "verified": true
  },
  {
    "id": "shao-2021",
    "citation": "Shao, X., Wilson, P., Saylor, J. R., & Bostwick, J. B. (2021). Surface wave pattern formation in a cylindrical container. Journal of Fluid Mechanics, 915, A19.",
    "url": "https://doi.org/10.1017/jfm.2021.97",
    "openAccessUrl": "https://cecas.clemson.edu/~jsaylor/paperPdfs/jfm.v915.2021.pdf",
    "verified": true
  },
  {
    "id": "sheldrake-2017",
    "citation": "Sheldrake, M., & Sheldrake, R. (2017). Determinants of Faraday wave-patterns in water samples oscillated vertically at a range of frequencies from 50–200 Hz. WATER, 9.",
    "url": "https://doi.org/10.14294/WATER.2017.6",
    "openAccessUrl": "https://waterjournal.org/archives/sheldrake",
    "verified": true
  },
  {
    "id": "robinson-adams-hooke-diary",
    "citation": "Hooke, R. (1935). The Diary of Robert Hooke, M.A., M.D., F.R.S., 1672–1680. Ed. H. W. Robinson & W. Adams. London: Taylor & Francis. (Reprinted London: Wykeham Publications, 1968.)",
    "url": "https://archive.org/details/diaryofroberthoo0000robe",
    "verified": false,
    "todo": "Open the 8 July 1680 entry in the published diary (the archive.org copy is borrow-only) and confirm the wording: flour, glass plate, bow. Until then the event says \"reported\"."
  },
  {
    "id": "mcveigh-2000",
    "citation": "McVeigh, D. P. (2000). An Early History of the Telephone 1664–1865: Robert Hooke's acoustic experiments and acoustic inventions. Institute for Learning Technologies, Teachers College, Columbia University (web page).",
    "url": "http://www.ilt.columbia.edu/projects/bluetelephone/html/hooke.html",
    "openAccessUrl": "http://web.archive.org/web/20130120044049/http://www.ilt.columbia.edu:80/projects/bluetelephone/html/hooke.html",
    "verified": true
  },
  {
    "id": "wheatstone-1833",
    "citation": "Wheatstone, C. (1833). On the figures obtained by strewing sand on vibrating surfaces, commonly called acoustic figures. Philosophical Transactions of the Royal Society of London 123, 593–633.",
    "url": "https://doi.org/10.1098/rstl.1833.0027",
    "openAccessUrl": "https://archive.org/details/philtrans07365800",
    "verified": true
  },
  {
    "id": "aps-news-2017-hooke",
    "citation": "American Physical Society (2017, 8 July). July 8, 1680: The first experiments that inspired 18th century 'Chladni figures'. APS News, This Month in Physics History.",
    "url": "https://www.aps.org/apsnews/2017/07/first-experiments-chladni-figures",
    "verified": true
  },
  {
    "id": "chladni-1787",
    "citation": "Chladni, E. F. F. (1787). Entdeckungen über die Theorie des Klanges. Leipzig: Weidmanns Erben und Reich.",
    "url": "https://mdz-nbn-resolving.de/urn:nbn:de:bvb:12-bsb10908815-6",
    "openAccessUrl": "https://archive.org/details/entdeckungenuber00chla",
    "verified": true
  },
  {
    "id": "chladni-2015-treatise",
    "citation": "Chladni, E. F. F. (2015). Treatise on Acoustics: The First Comprehensive English Translation of E.F.F. Chladni's Traité d'Acoustique. Cham: Springer.",
    "url": "https://doi.org/10.1007/978-3-319-20361-4",
    "verified": true
  },
  {
    "id": "gnd-authority-records",
    "citation": "Deutsche Nationalbibliothek. Gemeinsame Normdatei (GND) authority records: Chladni, Ernst Florens Friedrich (118520490); Faraday, Michael (118531921); Hooke, Robert (118774883); Jenny, Hans (11937398X); Germain, Sophie (119223015).",
    "url": "https://d-nb.info/gnd/118520490",
    "verified": true
  },
  {
    "id": "bucciarelli-dworsky-1980",
    "citation": "Bucciarelli, L. L., & Dworsky, N. (1980). Sophie Germain: An Essay in the History of the Theory of Elasticity. Dordrecht: D. Reidel (Springer Netherlands).",
    "url": "https://doi.org/10.1007/978-94-009-9051-7",
    "verified": true
  },
  {
    "id": "holmes-2023-germain",
    "citation": "Holmes, D. P. (2023). Germain curvature: The case for naming the mean curvature of a surface after Sophie Germain. arXiv:2303.13615 [preprint].",
    "url": "https://doi.org/10.48550/arXiv.2303.13615",
    "openAccessUrl": "https://arxiv.org/pdf/2303.13615",
    "verified": true
  },
  {
    "id": "oconnor-robertson-germain",
    "citation": "O'Connor, J. J., & Robertson, E. F. (updated 2020). Sophie Germain. MacTutor History of Mathematics Archive, University of St Andrews.",
    "url": "https://mathshistory.st-andrews.ac.uk/Biographies/Germain/",
    "verified": true
  },
  {
    "id": "dahan-dalmedico-1987",
    "citation": "Dahan-Dalmédico, A. (1987). Mécanique et théorie des surfaces: les travaux de Sophie Germain. Historia Mathematica 14(4), 347–365.",
    "url": "https://doi.org/10.1016/0315-0860(87)90066-8",
    "openAccessUrl": "https://doi.org/10.1016/0315-0860(87)90066-8",
    "verified": true
  },
  {
    "id": "faraday-1831",
    "citation": "Faraday, M. (1831). On a peculiar class of acoustical figures; and on certain forms assumed by groups of particles upon vibrating elastic surfaces. Philosophical Transactions of the Royal Society of London 121, 299–340.",
    "url": "https://doi.org/10.1098/rstl.1831.0018",
    "openAccessUrl": "https://archive.org/details/philtrans04212873",
    "verified": true
  },
  {
    "id": "kirchhoff-1850",
    "citation": "Kirchhoff, G. (1850). Über das Gleichgewicht und die Bewegung einer elastischen Scheibe. Journal für die reine und angewandte Mathematik 40, 51–88.",
    "url": "https://doi.org/10.1515/crll.1850.40.51",
    "openAccessUrl": "https://zenodo.org/record/1930408",
    "verified": true
  },
  {
    "id": "rayleigh-1877",
    "citation": "Strutt, J. W., Baron Rayleigh (1877). The Theory of Sound, Vol. I. London: Macmillan and Co.",
    "url": "https://archive.org/details/theorysound06raylgoog",
    "verified": true
  },
  {
    "id": "rayleigh-1878",
    "citation": "Strutt, J. W., Baron Rayleigh (1878). The Theory of Sound, Vol. II. London: Macmillan and Co.",
    "url": "https://archive.org/details/theorysound08raylgoog",
    "verified": true
  },
  {
    "id": "watts-hughes-1886",
    "citation": "Watts Hughes, M. (1886). Voice figures, with illustrations. Proceedings of the Musical Association 13, 133–144.",
    "url": "https://doi.org/10.1093/jrma/13.1.133",
    "verified": true
  },
  {
    "id": "watts-hughes-1891-century",
    "citation": "Watts Hughes, M. (1891). Visible sound. I. Voice-figures. The Century Illustrated Monthly Magazine 42(1) (May 1891), 37–40. [With: Herrick, S. B. II. Comment, pp. 40ff.]",
    "url": "https://archive.org/details/sim_century-illustrated-monthly-magazine_1891-05_42_1",
    "verified": true
  },
  {
    "id": "watts-hughes-1904",
    "citation": "Watts-Hughes, M. (1904). The Eidophone Voice Figures: Geometrical and Natural Forms Produced by Vibrations of the Human Voice (2nd ed.). London: The 'Christian Herald' Company.",
    "url": "https://www.mhs.ox.ac.uk/collections/library/catalogue-simple/authors/index0726.html?id=1401599",
    "verified": true
  },
  {
    "id": "griffith-1959-dwb",
    "citation": "Griffith, R. D. (1959). Hughes, Megan Watts (1842–1907), vocalist. Dictionary of Welsh Biography.",
    "url": "https://biography.wales/article/s-HUGH-WAT-1842",
    "verified": true
  },
  {
    "id": "ruhse-2026-artnodes",
    "citation": "Rühse, V. (2026). An un-disciplinary 19th-century invention: Margaret Watts Hughes' Voice Figures and the eidophone. Artnodes 39, 1–10.",
    "url": "https://doi.org/10.7238/artnodes.v0i39.20260516",
    "openAccessUrl": "https://raco.cat/index.php/Artnodes/article/view/980000017812",
    "verified": true
  },
  {
    "id": "waller-1961",
    "citation": "Waller, M. D. (1961). Chladni Figures: A Study in Symmetry. London: G. Bell and Sons. xxii + 164 pp.",
    "url": "https://doi.org/10.2307/3612644",
    "verified": true
  },
  {
    "id": "aim25-waller",
    "citation": "AIM25 / Royal Free Hospital archives. Waller, Mary Désirée, 1886–1959, physicist (authority record, Waller family papers, GB 1530 D11).",
    "url": "https://atom.aim25.com/index.php/waller-mary-desiree-1886-1959-physicist-br-waller-augustus-desire-1856-1922-physiologist-br-2",
    "verified": true
  },
  {
    "id": "waller-1957-ajp",
    "citation": "Waller, M. D. (1957). Interpreting Chladni figures. American Journal of Physics 25(3), 157–158.",
    "url": "https://doi.org/10.1119/1.1934385",
    "verified": true
  },
  {
    "id": "jenny-1967",
    "citation": "Jenny, H. (1967). Kymatik: Wellen und Schwingungen mit ihrer Struktur und Dynamik / Cymatics: The structure and dynamics of waves and vibrations [Bd. 1]. Basel: Basilius Presse.",
    "url": "https://lobid.org/resources/990143444970206441",
    "verified": true
  },
  {
    "id": "jenny-1972",
    "citation": "Jenny, H. (1972). Kymatik: Wellen und Schwingungen mit ihrer Struktur und Dynamik, Bd. 2. Basel: Basilius Presse.",
    "url": "https://lobid.org/resources/990123612750206441",
    "verified": true
  },
  {
    "id": "bartschi-hls-jenny",
    "citation": "Bärtschi, C. (2004, rev. 2013). Jenny, Hans. Historisches Lexikon der Schweiz (HLS).",
    "url": "https://hls-dhs-dss.ch/de/articles/027531",
    "verified": true
  },
  {
    "id": "kac-1966",
    "citation": "Kac, M. (1966). Can one hear the shape of a drum? The American Mathematical Monthly 73(4, Part 2), 1–23.",
    "url": "https://doi.org/10.1080/00029890.1966.11970915",
    "verified": true
  },
  {
    "id": "gordon-webb-wolpert-1992",
    "citation": "Gordon, C., Webb, D. L., & Wolpert, S. (1992). One cannot hear the shape of a drum. Bulletin of the American Mathematical Society 27(1), 134–138.",
    "url": "https://doi.org/10.1090/S0273-0979-1992-00289-6",
    "openAccessUrl": "https://pubs.ams.org/journals/bull/1992-27-01/S0273-0979-1992-00289-6/S0273-0979-1992-00289-6.pdf",
    "verified": true
  },
  {
    "id": "lauterwasser-2006",
    "citation": "Lauterwasser, A. (2006). Water Sound Images: The Creative Music of the Universe (G. M. Zielke, Trans.). Newmarket, NH: MACROmedia Publishing. 176 pp. ISBN 978-1-888138-09-2.",
    "url": "https://leonardo.info/reviews_archive/apr2007/water_harle.html",
    "verified": true
  },
  {
    "id": "harle-2007-leonardo",
    "citation": "Harle, R. (2007, 1 April). Review of Water Sound Images by Alexander Lauterwasser. Leonardo Reviews.",
    "url": "https://leonardo.info/reviews_archive/apr2007/water_harle.html",
    "verified": true
  },
  {
    "id": "kassewitz-2016",
    "citation": "Kassewitz, J., Hyson, M. T., Reid, J. S., & Barrera, R. L. (2016). A phenomenon discovered while imaging dolphin echolocation sounds. Journal of Marine Science: Research & Development 6(4), 202.",
    "url": "https://doi.org/10.4172/2155-9910.1000202",
    "openAccessUrl": "https://www.omicsonline.org/open-access/a-phenomenon-discovered-while-imaging-dolphin-echolocation-sounds-2155-9910-1000202.php?aid=76570",
    "verified": true
  },
  {
    "id": "ji-park-reid-2019",
    "citation": "Ji, S., Park, B. J., & Reid, J. S. (2019). Planck–Shannon classifier: A novel method to discriminate between sonified Raman signals from cancer and healthy cells. In Advances in Artificial Systems for Medicine and Education II (Advances in Intelligent Systems and Computing), pp. 185–195. Cham: Springer.",
    "url": "https://doi.org/10.1007/978-3-030-12082-5_17",
    "verified": true
  },
  {
    "id": "cymascope-oceanography",
    "citation": "CymaScope (n.d.). Oceanography. cymascope.com.",
    "url": "https://cymascope.com/oceanography/",
    "verified": true
  },
  {
    "id": "vezina-2015-mittr",
    "citation": "Vezina, K. (2015, 10 December). What does the world look like to a dolphin? We still don't know. MIT Technology Review.",
    "url": "https://www.technologyreview.com/2015/12/10/164592/what-does-the-world-look-like-to-a-dolphin-we-still-dont-know/",
    "verified": true
  },
  {
    "id": "poser-2016-languagelog",
    "citation": "Poser, B. (2016, 23 March). Cymascope: a new form of pseudoscience? Language Log (University of Pennsylvania).",
    "url": "https://languagelog.ldc.upenn.edu/nll/?p=24834",
    "verified": true
  },
  {
    "id": "ftc-v-omics-2019",
    "citation": "Federal Trade Commission v. OMICS Group Inc., No. 2:16-cv-02022 (D. Nev.), summary judgment 29 Mar 2019 (announced 3 Apr 2019); $50.1M judgment.",
    "url": "https://www.ftc.gov/enforcement/cases-proceedings/152-3113/federal-trade-commission-v-omics-group-inc",
    "verified": true
  }
];
