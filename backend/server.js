const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// 1. Session Start Logic (POST /api/sessions/start)
server.post('/api/sessions/start', (req, res) => {
  const { deckId, count } = req.body
  const db = router.db.getState()
  const targetCount = parseInt(count) || 10 // Default value is 10
  
  let pool = []
  let deckTitle = ""

  // Deck selection logic: configure a specific deck or the entire word pool
  if (deckId && deckId !== 'all') {
    const deck = db.decks.find(d => d.id === deckId)
    if (!deck) {
      return res.status(404).json({ error: "Deck not found" })
    }
    pool = deck.words
    deckTitle = deck.title
  } else {
    // Combine words from all decks
    pool = db.decks.flatMap(d => d.words)
    deckTitle = "All Decks"
  }

  if (pool.length === 0) {
    return res.status(404).json({ error: "No words available" })
  }

  // Extract the requested number of questions (allow random duplicates if count exceeds pool size)
  let selectedWords = []
  if (targetCount <= pool.length) {
    // If the pool is sufficient, shuffle and extract without duplicates
    selectedWords = [...pool].sort(() => 0.5 - Math.random()).slice(0, targetCount)
  } else {
    // If requested count is more than the pool, include all and add random ones until reaching target
    selectedWords = [...pool]
    while (selectedWords.length < targetCount) {
      const randomIndex = Math.floor(Math.random() * pool.length)
      selectedWords.push(pool[randomIndex])
    }
    // Shuffle one last time
    selectedWords.sort(() => 0.5 - Math.random())
  }

  // Create session data and save it to db.json
  const sessionData = {
    deckId: deckId || 'all',
    deckTitle: deckTitle,
    totalQuestions: selectedWords.length,
    words: selectedWords,
    startedAt: new Date().toISOString()
  }

  router.db.set('currentSession', sessionData).write()
  
  res.json({ success: true, message: "Session initialized", totalQuestions: selectedWords.length })
})

// 2. Fetch Session Questions (GET /api/sessions/questions)
// Return the stored session when called without parameters
server.get('/api/sessions/questions', (req, res) => {
  const db = router.db.getState()
  const session = db.currentSession

  if (!session) {
    return res.status(404).json({ error: "No active session found" })
  }

  res.json(session)
})

// Answer verification logic (maintained)
server.post('/verify-answer', (req, res) => {
  const { wordId, userInput } = req.body
  const db = router.db.getState()
  
  let foundWord = null
  for (const deck of db.decks) {
    foundWord = deck.words.find(w => w.id === wordId)
    if (foundWord) break
  }

  if (!foundWord) {
    return res.status(404).json({ error: "Word not found" })
  }

  const isCorrect = foundWord.answer.toLowerCase() === userInput.trim().toLowerCase()
  
  res.json({
    isCorrect,
    correctAnswer: isCorrect ? undefined : foundWord.answer
  })
})

server.use(router)
server.listen(3001, () => {
  console.log('WordFlow Mock Server is running on port 3001')
})