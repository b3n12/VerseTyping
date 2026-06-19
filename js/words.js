/* Common English words (top ~200) used for the typing test. */
const WORD_LIST = [
  "the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as",
  "with","his","they","i","at","be","this","have","from","or","one","had","by","word","but",
  "not","what","all","were","we","when","your","can","said","there","use","an","each","which",
  "she","do","how","their","if","will","up","other","about","out","many","then","them","these",
  "so","some","her","would","make","like","him","into","time","has","look","two","more","write",
  "go","see","number","no","way","could","people","my","than","first","water","been","call","who",
  "oil","its","now","find","long","down","day","did","get","come","made","may","part","over","new",
  "sound","take","only","little","work","know","place","year","live","me","back","give","most","very",
  "after","thing","our","just","name","good","sentence","man","think","say","great","where","help","through",
  "much","before","line","right","too","mean","old","any","same","tell","boy","follow","came","want",
  "show","also","around","form","three","small","set","put","end","does","another","well","large","must",
  "big","even","such","because","turn","here","why","ask","went","men","read","need","land","different",
  "home","us","move","try","kind","hand","picture","again","change","off","play","spell","air","away",
  "animal","house","point","page","letter","mother","answer","found","study","still","learn","should","world",
  "high","every","near","add","food","between","own","below","country","plant","last","school","father","keep",
  "tree","never","start","city","earth","eye","light","thought","head","under","story","saw","left","few",
  "while","along","might","close","something","seem","next","hard","open","example","begin","life","always","those",
  "both","paper","together","got","group","often","run","important","until","children","side","feet","car","mile"
];

const PUNCTUATION = [",",".",";",":","!","?","'","\"","-","(",")"];

/* Quote-mode passages: the Navigators' Topical Memory System (TMS), 60 verses (NIV).
   Typographic punctuation normalized to ASCII so the text is typeable on a standard keyboard. */
const QUOTES = [
  // Pack A - Living the New Life
  { text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!", source: "2 Corinthians 5:17" },
  { text: "I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.", source: "Galatians 2:20" },
  { text: "Therefore, I urge you, brothers and sisters, in view of God's mercy, to offer your bodies as a living sacrifice, holy and pleasing to God - this is your true and proper worship.", source: "Romans 12:1" },
  { text: "Whoever has my commands and keeps them is the one who loves me. The one who loves me will be loved by my Father, and I too will love them and show myself to them.", source: "John 14:21" },
  { text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness,", source: "2 Timothy 3:16" },
  { text: "Keep this Book of the Law always on your lips; meditate on it day and night, so that you may be careful to do everything written in it. Then you will be prosperous and successful.", source: "Joshua 1:8" },
  { text: "If you remain in me and my words remain in you, ask whatever you wish, and it will be done for you.", source: "John 15:7" },
  { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.", source: "Philippians 4:6-7" },
  { text: "For where two or three gather in my name, there am I with them.", source: "Matthew 18:20" },
  { text: "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another - and all the more as you see the Day approaching.", source: "Hebrews 10:24-25" },
  { text: "\"Come, follow me,\" Jesus said, \"and I will send you out to fish for people.\"", source: "Matthew 4:19" },
  { text: "For I am not ashamed of the gospel, because it is the power of God that brings salvation to everyone who believes: first to the Jew, then to the Gentile.", source: "Romans 1:16" },

  // Pack B - Proclaiming Christ
  { text: "for all have sinned and fall short of the glory of God,", source: "Romans 3:23" },
  { text: "We all, like sheep, have gone astray, each of us has turned to our own way; and the LORD has laid on him the iniquity of us all.", source: "Isaiah 53:6" },
  { text: "For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.", source: "Romans 6:23" },
  { text: "Just as people are destined to die once, and after that to face judgment,", source: "Hebrews 9:27" },
  { text: "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.", source: "Romans 5:8" },
  { text: "For Christ also suffered once for sins, the righteous for the unrighteous, to bring you to God. He was put to death in the body but made alive in the Spirit.", source: "1 Peter 3:18" },
  { text: "For it is by grace you have been saved, through faith - and this is not from yourselves, it is the gift of God - not by works, so that no one can boast.", source: "Ephesians 2:8-9" },
  { text: "he saved us, not because of righteous things we had done, but because of his mercy. He saved us through the washing of rebirth and renewal by the Holy Spirit,", source: "Titus 3:5" },
  { text: "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God -", source: "John 1:12" },
  { text: "Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with that person, and they with me.", source: "Revelation 3:20" },
  { text: "I write these things to you who believe in the name of the Son of God so that you may know that you have eternal life.", source: "1 John 5:13" },
  { text: "Very truly I tell you, whoever hears my word and believes him who sent me has eternal life and will not be judged but has crossed over from death to life.", source: "John 5:24" },

  // Pack C - Reliance on God's Resources
  { text: "Don't you know that you yourselves are God's temple and that God's Spirit dwells in your midst?", source: "1 Corinthians 3:16" },
  { text: "What we have received is not the spirit of the world, but the Spirit who is from God, so that we may understand what God has freely given us.", source: "1 Corinthians 2:12" },
  { text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", source: "Isaiah 41:10" },
  { text: "I can do all this through him who gives me strength.", source: "Philippians 4:13" },
  { text: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.", source: "Lamentations 3:22-23" },
  { text: "God is not human, that he should lie, not a human being, that he should change his mind. Does he speak and then not act? Does he promise and not fulfill?", source: "Numbers 23:19" },
  { text: "You will keep in perfect peace those whose minds are steadfast, because they trust in you.", source: "Isaiah 26:3" },
  { text: "Cast all your anxiety on him because he cares for you.", source: "1 Peter 5:7" },
  { text: "He who did not spare his own Son, but gave him up for us all - how will he not also, along with him, graciously give us all things?", source: "Romans 8:32" },
  { text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus.", source: "Philippians 4:19" },
  { text: "Because he himself suffered when he was tempted, he is able to help those who are being tempted.", source: "Hebrews 2:18" },
  { text: "How can a young person stay on the path of purity? By living according to your word. ... I have hidden your word in my heart that I might not sin against you.", source: "Psalm 119:9, 11" },

  // Pack D - Being Christ's Disciple
  { text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.", source: "Matthew 6:33" },
  { text: "Then he said to them all: \"Whoever wants to be my disciple must deny themselves and take up their cross daily and follow me.\"", source: "Luke 9:23" },
  { text: "Do not love the world or anything in the world. If anyone loves the world, love for the Father is not in them. For everything in the world - the lust of the flesh, the lust of the eyes, and the pride of life - comes not from the Father but from the world.", source: "1 John 2:15-16" },
  { text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is - his good, pleasing and perfect will.", source: "Romans 12:2" },
  { text: "Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.", source: "1 Corinthians 15:58" },
  { text: "Consider him who endured such opposition from sinners, so that you will not grow weary and lose heart.", source: "Hebrews 12:3" },
  { text: "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.", source: "Mark 10:45" },
  { text: "For what we preach is not ourselves, but Jesus Christ as Lord, and ourselves as your servants for Jesus' sake.", source: "2 Corinthians 4:5" },
  { text: "Honor the LORD with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine.", source: "Proverbs 3:9-10" },
  { text: "Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.", source: "2 Corinthians 9:6-7" },
  { text: "But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.", source: "Acts 1:8" },
  { text: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.", source: "Matthew 28:19-20" },

  // Pack E - Growth in Christlikeness
  { text: "\"A new command I give you: Love one another. As I have loved you, so you must love one another. By this everyone will know that you are my disciples, if you love one another.\"", source: "John 13:34-35" },
  { text: "Dear children, let us not love with words or speech but with actions and in truth.", source: "1 John 3:18" },
  { text: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves, not looking to your own interests but each of you to the interests of the others.", source: "Philippians 2:3-4" },
  { text: "In the same way, you who are younger, submit yourselves to your elders. All of you, clothe yourselves with humility toward one another, because, \"God opposes the proud but shows favor to the humble.\" Humble yourselves, therefore, under God's mighty hand, that he may lift you up in due time.", source: "1 Peter 5:5-6" },
  { text: "But among you there must not be even a hint of sexual immorality, or of any kind of impurity, or of greed, because these are improper for God's holy people.", source: "Ephesians 5:3" },
  { text: "Dear friends, I urge you, as foreigners and exiles, to abstain from sinful desires, which wage war against your soul.", source: "1 Peter 2:11" },
  { text: "Do not steal. Do not lie. Do not deceive one another.", source: "Leviticus 19:11" },
  { text: "So I strive always to keep my conscience clear before God and man.", source: "Acts 24:16" },
  { text: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.", source: "Hebrews 11:6" },
  { text: "Yet he did not waver through unbelief regarding the promise of God, but was strengthened in his faith and gave glory to God, being fully persuaded that God had power to do what he had promised.", source: "Romans 4:20-21" },
  { text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up. Therefore, as we have opportunity, let us do good to all people, especially to those who belong to the family of believers.", source: "Galatians 6:9-10" },
  { text: "In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", source: "Matthew 5:16" }
];
