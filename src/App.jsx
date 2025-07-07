import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// --- IMPORTANT: Set your Admin Email ---
// Replace this with the email address you want to be the admin
const ADMIN_EMAIL = "admin@test.com";

// --- NEW: Timer Configuration ---
const TOTAL_QUIZ_TIME = 600; // 10 minutes in seconds
const TIME_PER_QUESTION = 30; // 30 seconds per question


// --- Helper: Icon Components ---
const CheckCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);

const XCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
    </svg>
);

const SparklesIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.456-2.456L12.5 18l1.178-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.5 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);


// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyAYWy5ud80HXvDVj057hBjV9pSuOpbY8gU",
  authDomain: "test-bharath-app.firebaseapp.com",
  projectId: "test-bharath-app",
  storageBucket: "test-bharath-app.appspot.com",
  messagingSenderId: "903284437970",
  appId: "1:903284437970:web:32ac0d1351e1fad4824e0b",
  measurementId: "G-KGCVHHL3V8"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = firebaseConfig.appId;

// --- Sample Quiz Data ---
const sampleQuizzes = {
    'javascript_beginner': { questions: [ { questionText: 'What does "DOM" stand for?', options: ['Document Object Model', 'Data Object Model', 'Desktop Oriented Markup', 'Digital Ordinance Map'], correctAnswer: 'Document Object Model' }, { questionText: 'Which keyword is used to declare a variable that cannot be reassigned?', options: ['let', 'var', 'const', 'static'], correctAnswer: 'const' }, { questionText: 'What is `typeof null`?', options: ['"null"', '"undefined"', '"object"', '"string"'], correctAnswer: '"object"' }, { questionText: 'Which method adds an element to the end of an array?', options: ['.push()', '.pop()', '.shift()', '.unshift()'], correctAnswer: '.push()' }, { questionText: 'How do you write a single-line comment in JavaScript?', options: ['// comment', '/* comment */', '<!-- comment -->', '# comment'], correctAnswer: '// comment' }, ] },
    'javascript_intermediate': { questions: [ { questionText: 'What is the purpose of the `...` spread operator?', options: ['To comment out code', 'To expand an iterable into individual elements', 'To declare a private variable', 'To multiply numbers'], correctAnswer: 'To expand an iterable into individual elements' }, { questionText: 'Which method is used to create a new array with all elements that pass a test?', options: ['.forEach()', '.map()', '.filter()', '.reduce()'], correctAnswer: '.filter()' }, { questionText: 'What does `async/await` help with?', options: ['Styling components', 'Synchronous code execution', 'Handling Promises more cleanly', 'Creating loops'], correctAnswer: 'Handling Promises more cleanly' }, { questionText: 'What is object destructuring?', options: ['Deleting an object', 'A way to extract properties from an object into variables', 'Combining two objects', 'A type of error'], correctAnswer: 'A way to extract properties from an object into variables' }, { questionText: 'A Promise in JavaScript can be in one of how many states?', options: ['2 (Resolved, Rejected)', '3 (Pending, Fulfilled, Rejected)', '1 (Pending)', '4 (Pending, Fulfilled, Rejected, Canceled)'], correctAnswer: '3 (Pending, Fulfilled, Rejected)' }, ] },
    'javascript_expert': { questions: [ { questionText: 'What is a closure in JavaScript?', options: ['A way to lock a variable', 'A function bundled with its lexical environment', 'A syntax error', 'An outdated event handler'], correctAnswer: 'A function bundled with its lexical environment' }, { questionText: 'What does the `this` keyword refer to in an arrow function?', options: ['The global object', 'The object that called the function', 'The enclosing lexical context\'s `this`', 'It is always `undefined`'], correctAnswer: 'The enclosing lexical context\'s `this`' }, { questionText: 'What is the main purpose of the Event Loop?', options: ['To execute code line by line', 'To handle errors', 'To process callbacks from the queue when the call stack is empty', 'To manage memory allocation'], correctAnswer: 'To process callbacks from the queue when the call stack is empty' }, { questionText: 'How does prototypal inheritance work?', options: ['Objects inherit directly from other classes', 'Objects inherit directly from other objects', 'It is a way to create private properties', 'It only applies to functions'], correctAnswer: 'Objects inherit directly from other objects' }, { questionText: 'What is the difference between `==` and `===`?', options: ['No difference, they are interchangeable', '`==` compares value, `===` compares value and type', '`===` compares value, `==` compares value and type', '`===` is for assignment, `==` is for comparison'], correctAnswer: '`==` compares value, `===` compares value and type' }, ] },
    'python_beginner': { questions: [ { questionText: 'What is the correct file extension for Python files?', options: ['.pyth', '.pt', '.py', '.python'], correctAnswer: '.py' }, { questionText: 'How do you create a function in Python?', options: ['def myFunction():', 'function myFunction():', 'create myFunction():', 'function:myFunction()'], correctAnswer: 'def myFunction():' }, { questionText: 'Which data type is used to store a sequence of characters?', options: ['str', 'char', 'string', 'text'], correctAnswer: 'str' }, { questionText: 'What is the output of `print(2 ** 3)`?', options: ['6', '8', '9', '5'], correctAnswer: '8' }, { questionText: 'Which keyword is used to exit a loop?', options: ['exit', 'quit', 'break', 'stop'], correctAnswer: 'break' }, ] },
    'python_intermediate': { questions: [ { questionText: 'What is a list comprehension?', options: ['A way to understand lists', 'A compact way to create lists', 'A type of list error', 'A function to measure list length'], correctAnswer: 'A compact way to create lists' }, { questionText: 'What does a decorator do in Python?', options: ['Adds styling to output', 'A function that modifies another function', 'Deletes a function', 'A type of variable'], correctAnswer: 'A function that modifies another function' }, { questionText: 'What is the purpose of the `self` keyword in a class method?', options: ['It refers to the parent class', 'It is a global variable', 'It refers to the instance of the class', 'It is optional and has no purpose'], correctAnswer: 'It refers to the instance of the class' }, { questionText: 'How do you open a file named "data.txt" for writing in Python?', options: ['open("data.txt", "r")', 'open("data.txt")', 'open("data.txt", "w")', 'open.file("data.txt", "w")'], correctAnswer: 'open("data.txt", "w")' }, { questionText: 'What is a lambda function?', options: ['A multi-line function', 'A named function', 'A small anonymous function', 'A function that can only be used once'], correctAnswer: 'A small anonymous function' }, ] },
    'python_expert': { questions: [ { questionText: 'What is the primary use of the `yield` keyword?', options: ['To end a function', 'To create a generator', 'To return multiple values at once', 'To declare a global variable'], correctAnswer: 'To create a generator' }, { questionText: 'What are `*args` and `**kwargs` used for in function definitions?', options: ['For pointer arithmetic', 'To pass a variable number of arguments', 'To define required arguments', 'To import modules'], correctAnswer: 'To pass a variable number of arguments' }, { questionText: 'What is a metaclass in Python?', options: ['A class for storing metadata', 'A class that is an instance of another class', 'A class that creates classes', 'A function that behaves like a class'], correctAnswer: 'A class that creates classes' }, { questionText: 'What is the Global Interpreter Lock (GIL) in CPython?', options: ['A security feature', 'A mutex that allows only one thread to execute Python bytecode at a time', 'A tool for debugging', 'A way to lock global variables'], correctAnswer: 'A mutex that allows only one thread to execute Python bytecode at a time' }, { questionText: 'How do you create a context manager in Python?', options: ['Using a decorator', 'Using the `with` statement and a class with `__enter__` and `__exit__` methods', 'Using a lambda function', 'It is a built-in data type'], correctAnswer: 'Using the `with` statement and a class with `__enter__` and `__exit__` methods' }, ] },
    'sql_beginner': { questions: [ { questionText: 'What does SQL stand for?', options: ['Structured Query Language', 'Strong Question Language', 'Simple Query Lexicon', 'Scripted Query Language'], correctAnswer: 'Structured Query Language' }, { questionText: 'Which SQL statement is used to extract data from a database?', options: ['GET', 'OPEN', 'EXTRACT', 'SELECT'], correctAnswer: 'SELECT' }, { questionText: 'Which SQL clause is used to filter records?', options: ['FILTER BY', 'WHERE', 'SEARCH', 'CONDITION'], correctAnswer: 'WHERE' }, { questionText: 'Which SQL keyword is used to sort the result-set?', options: ['SORT BY', 'ORDER BY', 'ARRANGE', 'SORT'], correctAnswer: 'ORDER BY' }, { questionText: 'How can you insert a new record into the "Customers" table?', options: ['ADD INTO Customers...', 'INSERT INTO Customers...', 'NEW Customers...', 'INSERT Customers...'], correctAnswer: 'INSERT INTO Customers...' }, ] },
    'sql_intermediate': { questions: [ { questionText: 'Which type of JOIN returns all records from the left table, and the matched records from the right table?', options: ['INNER JOIN', 'RIGHT JOIN', 'FULL JOIN', 'LEFT JOIN'], correctAnswer: 'LEFT JOIN' }, { questionText: 'What is the purpose of the `GROUP BY` clause?', options: ['To sort the result set', 'To group rows that have the same values into summary rows', 'To filter records', 'To join tables'], correctAnswer: 'To group rows that have the same values into summary rows' }, { questionText: 'Which aggregate function returns the number of rows?', options: ['SUM()', 'AVG()', 'COUNT()', 'MAX()'], correctAnswer: 'COUNT()' }, { questionText: 'What is a subquery?', options: ['A query that is nested inside another query', 'A query that cannot be executed', 'An outdated query format', 'A query to create a table'], correctAnswer: 'A query that is nested inside another query' }, { questionText: 'The `HAVING` clause was added to SQL because the `WHERE` keyword could not be used with what?', options: ['Functions', 'Subqueries', 'Aggregate functions', 'JOINs'], correctAnswer: 'Aggregate functions' }, ] },
    'sql_expert': { questions: [ { questionText: 'What is a Common Table Expression (CTE)?', options: ['A temporary named result set that you can reference within another SQL statement', 'A permanent table', 'A type of index', 'A security feature'], correctAnswer: 'A temporary named result set that you can reference within another SQL statement' }, { questionText: 'What is the purpose of a window function like `ROW_NUMBER()`?', options: ['To calculate a running total', 'To assign a unique integer to each row within a partition of a result set', 'To find the average value', 'To join two tables'], correctAnswer: 'To assign a unique integer to each row within a partition of a result set' }, { questionText: 'What does a `TRANSACTION` ensure in a database?', options: ['Faster queries', 'That a group of SQL statements execute as a single, atomic unit', 'Better security', 'Automatic backups'], correctAnswer: 'That a group of SQL statements execute as a single, atomic unit' }, { questionText: 'What is the primary purpose of creating an index on a table?', options: ['To enforce uniqueness', 'To speed up the performance of queries', 'To store data in a sorted order', 'To make the table read-only'], correctAnswer: 'To speed up the performance of queries' }, { questionText: 'Which statement is used to combine the result-sets of two or more SELECT statements?', options: ['COMBINE', 'MERGE', 'UNION', 'JOIN'], correctAnswer: 'UNION' }, ] }
};

// --- Auth Component ---
const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-xl shadow-2xl">
                <div>
                    <h2 className="text-3xl font-bold text-center text-white">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400">
                        to access your Skill Index
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-t-md" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-b-md" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-500">
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-400 hover:text-indigo-300">
                        {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Admin Panel Component ---
const AdminPanel = ({ onSeedDatabase, seeding, seeded }) => {
    const [track, setTrack] = useState('javascript');
    const [level, setLevel] = useState('beginner');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminMessage, setAdminMessage] = useState('');

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        if (!questionText || options.some(opt => opt === '') || !correctAnswer) {
            setAdminMessage('Please fill all fields.');
            return;
        }
        setIsSubmitting(true);
        setAdminMessage('');

        const quizId = `${track.toLowerCase()}_${level.toLowerCase()}`;
        const newQuestion = { questionText, options, correctAnswer };

        try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
            const docSnap = await getDoc(docRef);

            let updatedQuestions = [];
            if (docSnap.exists()) {
                updatedQuestions = docSnap.data().questions;
            }
            updatedQuestions.push(newQuestion);
            
            await setDoc(docRef, { questions: updatedQuestions });

            setAdminMessage(`Successfully added question to ${track} - ${level}!`);
            setQuestionText('');
            setOptions(['', '', '', '']);
            setCorrectAnswer('');

        } catch (error) {
            console.error("Error creating quiz:", error);
            setAdminMessage('Error creating quiz. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 my-8 bg-slate-800 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Admin Panel</h2>
            
            <form onSubmit={handleCreateQuiz} className="space-y-4 text-white">
                <h3 className="text-xl font-semibold">Create New Quiz Question</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Track</label>
                        <select value={track} onChange={(e) => setTrack(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-slate-700 bg-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Level</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-slate-700 bg-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300">Question</label>
                    <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows="3" className="mt-1 block w-full shadow-sm sm:text-sm border-slate-700 bg-slate-900 rounded-md"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((opt, index) => (
                        <div key={index}>
                            <label className="block text-sm font-medium text-slate-300">Option {index + 1}</label>
                            <input type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-700 bg-slate-900 rounded-md" />
                        </div>
                    ))}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Correct Answer</label>
                    <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Must match one of the options exactly" className="mt-1 block w-full shadow-sm sm:text-sm border-slate-700 bg-slate-900 rounded-md" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500">
                    {isSubmitting ? 'Submitting...' : 'Add Question'}
                </button>
                {adminMessage && <p className="text-center text-sm text-yellow-300 mt-2">{adminMessage}</p>}
            </form>

            <div className="mt-8 pt-4 border-t border-slate-700 text-center">
                 <button onClick={onSeedDatabase} disabled={seeding || seeded} className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${seeded ? 'bg-green-600 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600'} ${seeding ? 'animate-pulse' : ''}`}>
                    {seeding ? 'Seeding...' : (seeded ? 'Sample Quizzes Seeded!' : 'Seed Sample Quizzes')}
                </button>
                <p className="text-xs text-slate-500 mt-2">This will add predefined questions for all tracks and levels.</p>
            </div>
        </div>
    );
};


// --- Components ---
const TrackSelection = ({ onStartTest, isAdmin, onSeedDatabase, seeding, seeded }) => {
    const tracks = [
        { id: 'javascript', name: 'JavaScript', color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
        { id: 'python', name: 'Python', color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
        { id: 'sql', name: 'SQL', color: 'bg-teal-500', hover: 'hover:bg-teal-600' },
    ];
    const levels = ['Beginner', 'Intermediate', 'Expert'];

    const [selectedTrack, setSelectedTrack] = useState(null);

    return (
        <>
            <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Technical Skills Index</h1>
                    <p className="text-slate-400 text-lg">Choose your track and level to start the assessment.</p>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
                    <h2 className="text-2xl font-semibold text-white mb-6 border-b border-slate-700 pb-4">1. Select a Track</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tracks.map(track => (
                            <button key={track.id} onClick={() => setSelectedTrack(track.id)} className={`p-6 rounded-lg text-white font-bold text-xl transition-all duration-300 transform ${track.color} ${selectedTrack === track.id ? 'ring-4 ring-offset-2 ring-offset-slate-800 ring-white scale-105' : track.hover + ' hover:scale-105'}`}>
                                {track.name}
                            </button>
                        ))}
                    </div>

                    {selectedTrack && (
                        <div className="mt-8 pt-6 border-t border-slate-700">
                            <h2 className="text-2xl font-semibold text-white mb-6">2. Select a Level</h2>
                            <div className="flex flex-col md:flex-row justify-center gap-4">
                                {levels.map(level => (
                                    <button key={level} onClick={() => onStartTest(selectedTrack, level)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg w-full md:w-auto">
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isAdmin && <AdminPanel onSeedDatabase={onSeedDatabase} seeding={seeding} seeded={seeded} />}
        </>
    );
};

const Quiz = ({ db, track, level, onFinish }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    const [totalTime, setTotalTime] = useState(TOTAL_QUIZ_TIME);
    const [questionTime, setQuestionTime] = useState(TIME_PER_QUESTION);

    const handleFinishQuiz = useCallback(() => {
        let score = 0;
        for (let i = 0; i < questions.length; i++) {
            if (selectedAnswers[i] === questions[i].correctAnswer) {
                score++;
            }
        }
        onFinish(score, questions.length, questions, selectedAnswers);
    }, [questions, selectedAnswers, onFinish]);

    const handleNext = useCallback(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionTime(TIME_PER_QUESTION);
        } else {
            handleFinishQuiz();
        }
    }, [currentQuestionIndex, questions.length, handleFinishQuiz, timeoutId]);

    useEffect(() => {
        if(questions.length === 0) return; // Don't start timers until questions are loaded

        const timer = setInterval(() => {
            setTotalTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinishQuiz();
                    return 0;
                }
                return prev - 1;
            });

            setQuestionTime(prev => {
                if (prev <= 1) {
                    handleNext();
                    return TIME_PER_QUESTION;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [handleFinishQuiz, handleNext, questions]);

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            setError(null);
            const quizId = `${track.toLowerCase()}_${level.toLowerCase()}`;
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().questions.length > 0) {
                    setQuestions(docSnap.data().questions);
                } else {
                    setError(`No quiz found for ${track} - ${level}. Please seed the database or ask an admin to add questions.`);
                }
            } catch (err) {
                console.error("Error fetching quiz:", err);
                setError("Failed to load the quiz. Please check your connection and try again.");
            }
            setIsLoading(false);
        };
        fetchQuestions();
    }, [db, track, level]);

    const handleAnswerSelect = (option) => {
        if (selectedAnswers[currentQuestionIndex]) return;

        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
        
        const id = setTimeout(() => {
            handleNext();
        }, 1200);
        setTimeoutId(id);
    };

    if (isLoading) {
        return <div className="text-white text-center p-10 text-2xl">Loading Quiz...</div>;
    }

    if (error) {
        return <div className="text-red-400 text-center p-10 text-2xl">{error}</div>;
    }

    if (questions.length === 0) {
        return <div className="text-white text-center p-10 text-2xl">No questions available for this quiz.</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
            <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
                <div className="mb-6">
                     <div className="flex justify-between items-center mb-4 text-slate-300">
                        <div className="text-lg">
                            Total Time: <span className="font-bold text-white">{Math.floor(totalTime / 60)}:{('0' + totalTime % 60).slice(-2)}</span>
                        </div>
                         <div className="text-lg">
                            Question Time: <span className="font-bold text-white">{questionTime}s</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-slate-400">
                        <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
                        <p className="font-semibold capitalize">{track} - {level}</p>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 min-h-[100px]">{currentQuestion.questionText}</h2>

                <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === option;
                        let buttonClass = "bg-slate-700 hover:bg-slate-600";
                        if (isSelected) {
                            buttonClass = "bg-indigo-600";
                        }

                        return (
                            <button key={index} onClick={() => handleAnswerSelect(option)} disabled={selectedAnswers[currentQuestionIndex]} className={`w-full text-left p-4 rounded-lg text-white font-medium transition-colors duration-200 text-lg ${buttonClass} disabled:cursor-not-allowed`}>
                                {option}
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-8 text-right">
                    <button onClick={handleNext} disabled={!selectedAnswers[currentQuestionIndex]} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                        {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Results = ({ db, userId, track, level, score, totalQuestions, onRestart, questions, selectedAnswers }) => {
    const percentage = Math.round((score / totalQuestions) * 100);
    const [studyGuide, setStudyGuide] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        const saveResult = async () => {
            if (!userId) return;
            try {
                const resultsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'progress');
                await addDoc(resultsCollectionRef, { track, level, score, totalQuestions, percentage, completedAt: new Date() });
            } catch (error) {
                console.error("Error saving result: ", error);
            }
        };
        saveResult();
    }, [db, userId, track, level, score, totalQuestions, percentage]);
    
    const handleGenerateStudyGuide = async () => {
        setIsGenerating(true);
        setStudyGuide('');
        setGenerationError('');

        const prompt = `Create a concise study guide for a ${level}-level learner in ${track}. The user just completed a quiz and needs a focused guide to help them improve. Include the following sections: 1. Key Concepts: A bulleted list of the most important topics for this level. 2. Code Examples: Simple, clear code snippets demonstrating 2-3 of the key concepts. 3. Study Tips: Actionable advice on how to practice and improve. Format the output clearly with headings.`;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const result = await response.json();
            
            if (result.candidates?.[0]?.content?.parts?.[0]) {
                setStudyGuide(result.candidates[0].content.parts[0].text);
            } else {
                throw new Error("Invalid response structure from API.");
            }
        } catch (error) {
            console.error("Error generating study guide:", error);
            setGenerationError("Sorry, we couldn't generate the study guide at this time. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    };

    let feedback = {
        title: "Great Effort!",
        message: "Keep practicing to master this skill.",
        color: "text-yellow-400"
    };
    if (percentage >= 80) {
        feedback = { title: "Excellent!", message: "You have a strong command of this topic.", color: "text-green-400" };
    } else if (percentage < 40) {
        feedback = { title: "Needs Improvement", message: "Review the basics and try again.", color: "text-red-400" };
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8 text-center">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
                <p className="text-slate-400 capitalize mb-6">{track} - {level}</p>

                <div className="my-8">
                    <p className="text-slate-300 text-lg">You Scored</p>
                    <p className="text-6xl font-bold text-white my-2">{score} / {totalQuestions}</p>
                    <p className={`text-4xl font-bold ${feedback.color}`}>{percentage}%</p>
                </div>
                
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h3 className={`text-2xl font-semibold ${feedback.color}`}>{feedback.title}</h3>
                    <p className="text-slate-300 mt-2">{feedback.message}</p>
                </div>

                <div className="mt-8 space-y-4">
                    <button onClick={() => setShowReview(!showReview)} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                        {showReview ? 'Hide Review' : 'Review Answers'}
                    </button>
                    <button onClick={handleGenerateStudyGuide} disabled={isGenerating} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                        {isGenerating ? ( <><div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div><span>Generating...</span></> ) : ( <><SparklesIcon className="w-6 h-6" /><span>Generate Study Guide</span></> )}
                    </button>
                    <button onClick={onRestart} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                        Back to Home
                    </button>
                </div>
            </div>

            {showReview && (
                <div className="mt-6 w-full max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl shadow-2xl text-left space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Quiz Review</h2>
                    {questions.map((q, index) => {
                        const userAnswer = selectedAnswers[index];
                        const isCorrect = userAnswer === q.correctAnswer;
                        return (
                            <div key={index} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                                <p className="font-bold text-white mb-2">Q{index + 1}: {q.questionText}</p>
                                <p className={`text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>Your answer: <span className="font-semibold">{userAnswer || 'Not Answered'}</span></p>
                                {!isCorrect && <p className="text-sm text-green-300">Correct answer: <span className="font-semibold">{q.correctAnswer}</span></p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {generationError && ( <div className="mt-6 w-full max-w-2xl mx-auto p-4 bg-red-900/50 text-red-300 rounded-lg"><p>{generationError}</p></div> )}
            {studyGuide && (
                <div className="mt-6 w-full max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl shadow-2xl text-left">
                    <h2 className="text-2xl font-bold text-white mb-4">✨ Your Personalized Study Guide</h2>
                    <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 whitespace-pre-wrap font-mono">{studyGuide}</div>
                    <button onClick={() => setStudyGuide('')} className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Close Guide</button>
                </div>
            )}
        </div>
    );
};

const AppHeader = ({ user, onSignOut }) => (
    <header className="bg-slate-800 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Skill Index</h1>
            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">{user.email}</span>
                <button onClick={onSignOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                    Sign Out
                </button>
            </div>
        </div>
    </header>
);


export default function App() {
    const [view, setView] = useState('home');
    const [quizConfig, setQuizConfig] = useState({ track: null, level: null });
    const [quizResult, setQuizResult] = useState({ score: 0, totalQuestions: 0, questions: [], selectedAnswers: {} });
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [seeded, setSeeded] = useState(false);
    
    const isAdmin = user && user.email === ADMIN_EMAIL;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
        setView('home');
    };

    const handleSeedDatabase = useCallback(async () => {
        setSeeding(true);
        console.log("Seeding database with sample quizzes...");
        try {
            for (const quizId in sampleQuizzes) {
                const quizData = sampleQuizzes[quizId];
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
                await setDoc(docRef, quizData);
                console.log(`Seeded ${quizId}`);
            }
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', 'javascript_expert');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) setSeeded(true);
        } catch (error) {
            console.error("Error seeding database: ", error);
        }
        setSeeding(false);
    }, []);

    const handleStartTest = (track, level) => {
        setQuizConfig({ track, level });
        setView('test');
    };

    const handleFinishTest = (score, totalQuestions, questions, selectedAnswers) => {
        setQuizResult({ score, totalQuestions, questions, selectedAnswers });
        setView('results');
    };

    const handleRestart = () => {
        setView('home');
        setQuizConfig({ track: null, level: null });
        setQuizResult({ score: 0, totalQuestions: 0, questions: [], selectedAnswers: {} });
    };
    
    const renderView = () => {
        switch (view) {
            case 'test':
                return <Quiz db={db} track={quizConfig.track} level={quizConfig.level} onFinish={handleFinishTest} />;
            case 'results':
                return <Results db={db} userId={user.uid} track={quizConfig.track} level={quizConfig.level} {...quizResult} onRestart={handleRestart} />;
            case 'home':
            default:
                return <TrackSelection onStartTest={handleStartTest} isAdmin={isAdmin} onSeedDatabase={handleSeedDatabase} seeding={seeding} seeded={seeded} />;
        }
    };

    if (!isAuthReady) {
        return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white text-2xl">Loading...</div>;
    }

    return (
        <div className="bg-slate-900 min-h-screen w-full font-sans">
            {!user ? (
                <AuthScreen />
            ) : (
                <>
                    <AppHeader user={user} onSignOut={handleSignOut} />
                    <main className="flex items-center justify-center p-4">
                        <style>{`.prose-invert { --tw-prose-body: #d1d5db; --tw-prose-headings: #fff; --tw-prose-lead: #a1a1aa; --tw-prose-links: #fff; --tw-prose-bold: #fff; --tw-prose-counters: #a1a1aa; --tw-prose-bullets: #a1a1aa; --tw-prose-hr: #404040; --tw-prose-quotes: #f3f4f6; --tw-prose-quote-borders: #404040; --tw-prose-captions: #a1a1aa; --tw-prose-code: #fff; --tw-prose-pre-code: #d1d5db; --tw-prose-pre-bg: #1f2937; --tw-prose-th-borders: #404040; --tw-prose-td-borders: #374151; }`}</style>
                        <div className="w-full">
                            {renderView()}
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}
