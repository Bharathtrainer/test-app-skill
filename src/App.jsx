import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
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

// --- Default Timer Configuration (fallback) ---
const DEFAULT_TOTAL_QUIZ_TIME = 600; // 10 minutes in seconds
const DEFAULT_TIME_PER_QUESTION = 30; // 30 seconds per question


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
    'javascript_beginner': { questions: [ { questionText: 'What does "DOM" stand for?', options: ['Document Object Model', 'Data Object Model', 'Desktop Oriented Markup', 'Digital Ordinance Map'], correctAnswer: 'Document Object Model', explanation: 'The DOM represents the page so that programs can change the document structure, style, and content.' }, { questionText: 'Which keyword is used to declare a variable that cannot be reassigned?', options: ['let', 'var', 'const', 'static'], correctAnswer: 'const', explanation: '`const` declares a block-scoped variable, but its value cannot be reassigned.' } ] },
    'react_beginner': { questions: [ { questionText: 'What is JSX?', options: ['JavaScript XML', 'JavaScript Extension', 'Java Syntax Extension', 'JSON Syntax Extension'], correctAnswer: 'JavaScript XML', explanation: 'JSX is a syntax extension for JavaScript that lets you write HTML-like markup inside a JavaScript file.' }, { questionText: 'Which hook is used to manage state in a functional component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswer: 'useState', explanation: 'The `useState` hook is a special function that lets you “hook into” React features.' } ] },
    'devops_beginner': { questions: [ { questionText: 'What is CI/CD?', options: ['Continuous Integration / Continuous Deployment', 'Code Integration / Code Deployment', 'Continuous Information / Continuous Data', 'Code Information / Code Data'], correctAnswer: 'Continuous Integration / Continuous Deployment', explanation: 'CI/CD is a method to frequently deliver apps to customers by introducing automation into the stages of app development.' }, { questionText: 'What is a popular containerization platform?', options: ['Docker', 'Kubernetes', 'Jenkins', 'Ansible'], correctAnswer: 'Docker', explanation: 'Docker is an open platform for developing, shipping, and running applications in containers.' } ] }
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
    // State for single question form
    const [manualTrack, setManualTrack] = useState('javascript');
    const [manualLevel, setManualLevel] = useState('beginner');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    
    // State for file upload
    const [fileTrack, setFileTrack] = useState('javascript');
    const [fileLevel, setFileLevel] = useState('beginner');
    const [file, setFile] = useState(null);

    // State for timer config
    const [totalTime, setTotalTime] = useState(DEFAULT_TOTAL_QUIZ_TIME);
    const [questionTime, setQuestionTime] = useState(DEFAULT_TIME_PER_QUESTION);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminMessage, setAdminMessage] = useState('');
    const [questionCounts, setQuestionCounts] = useState({});

    const hasUnsavedChanges = questionText || options.some(opt => opt) || correctAnswer || explanation || file;

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);

    const fetchAdminData = useCallback(async () => {
        // Fetch question counts
        const counts = {};
        const quizzesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'quizzes');
        const querySnapshot = await getDocs(quizzesCollectionRef);
        querySnapshot.forEach((doc) => {
            const [track, level] = doc.id.split('_');
            const count = doc.data().questions?.length || 0;
            if (!counts[track]) {
                counts[track] = {};
            }
            counts[track][level] = count;
        });
        setQuestionCounts(counts);

        // Fetch timer config
        const timerConfigRef = doc(db, 'settings', 'timers');
        const timerConfigSnap = await getDoc(timerConfigRef);
        if (timerConfigSnap.exists()) {
            setTotalTime(timerConfigSnap.data().totalQuizTime);
            setQuestionTime(timerConfigSnap.data().timePerQuestion);
        }
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSaveTimers = async () => {
        setIsSubmitting(true);
        setAdminMessage('');
        try {
            const docRef = doc(db, 'settings', 'timers');
            await setDoc(docRef, {
                totalQuizTime: Number(totalTime),
                timePerQuestion: Number(questionTime)
            });
            setAdminMessage({ type: 'success', text: 'Timer settings saved!' });
        } catch (error) {
            setAdminMessage({ type: 'error', text: 'Failed to save timer settings.' });
            console.error("Error saving timers:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        if (!questionText || options.some(opt => opt === '') || !correctAnswer) {
            setAdminMessage({ type: 'error', text: 'Please fill all fields for the single question.' });
            return;
        }
        setIsSubmitting(true);
        setAdminMessage('');

        const quizId = `${manualTrack.toLowerCase()}_${manualLevel.toLowerCase()}`;
        const newQuestion = { questionText, options, correctAnswer, explanation };

        try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
            const docSnap = await getDoc(docRef);

            let updatedQuestions = [];
            if (docSnap.exists()) {
                updatedQuestions = docSnap.data().questions;
            }
            updatedQuestions.push(newQuestion);
            
            await setDoc(docRef, { questions: updatedQuestions });

            setAdminMessage({ type: 'success', text: `Successfully added question to ${manualTrack} - ${manualLevel}!` });
            setQuestionText('');
            setOptions(['', '', '', '']);
            setCorrectAnswer('');
            setExplanation('');
            fetchAdminData(); // Refresh counts

        } catch (error) {
            console.error("Error creating quiz:", error);
            setAdminMessage({ type: 'error', text: 'Error creating quiz. Check console for details.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === "application/json" || selectedFile.type === "text/csv")) {
            setFile(selectedFile);
            setAdminMessage('');
        } else {
            setFile(null);
            setAdminMessage({ type: 'error', text: 'Please upload a valid JSON or CSV file.' });
        }
    };

    const processAndUploadFile = async () => {
        if (!file) {
            setAdminMessage({ type: 'error', text: 'Please select a file to upload.' });
            return;
        }
        setIsSubmitting(true);
        setAdminMessage({ type: 'info', text: 'Processing file...' });

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target.result;
            try {
                let newQuestions = [];
                if (file.type === "application/json") {
                    const data = JSON.parse(fileContent);
                    if(Array.isArray(data)) {
                        newQuestions = data;
                    } else {
                        throw new Error("JSON file must be an array of question objects.");
                    }
                } else if (file.type === "text/csv") {
                    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
                    const headers = lines[0].split(',').map(h => h.trim());
                    for (let i = 1; i < lines.length; i++) {
                        const data = lines[i].split(',').map(d => d.trim().replace(/^"|"$/g, ''));
                        const row = headers.reduce((obj, nextKey, index) => {
                            obj[nextKey] = data[index];
                            return obj;
                        }, {});
                        
                        newQuestions.push({
                            questionText: row.questionText,
                            options: [row.option1, row.option2, row.option3, row.option4],
                            correctAnswer: row.correctAnswer,
                            explanation: row.explanation || ''
                        });
                    }
                }

                const quizId = `${fileTrack.toLowerCase()}_${fileLevel.toLowerCase()}`;
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
                const docSnap = await getDoc(docRef);
                let existingQuestions = docSnap.exists() ? docSnap.data().questions : [];

                await setDoc(docRef, { questions: [...existingQuestions, ...newQuestions] });

                setAdminMessage({ type: 'success', text: `Successfully uploaded ${newQuestions.length} questions to ${fileTrack} - ${fileLevel}!` });
                setFile(null);
                fetchAdminData();

            } catch (error) {
                console.error("Error processing file:", error);
                setAdminMessage({ type: 'error', text: 'Error processing file. Make sure it is correctly formatted.' });
            } finally {
                setIsSubmitting(false);
            }
        };
        reader.readAsText(file);
    };

    const csvTemplate = "questionText,option1,option2,option3,option4,correctAnswer,explanation\n\"What is the purpose of `useEffect`?\",\"To manage component state\",\"To perform side effects in components\",\"To create context\",\"To handle routing\",\"To perform side effects in components\",\"It allows you to perform side effects from a function component.\"";
    const jsonTemplate = JSON.stringify([{
        "questionText": "What is the purpose of `useEffect`?",
        "options": ["To manage component state", "To perform side effects in components", "To create context", "To handle routing"],
        "correctAnswer": "To perform side effects in components",
        "explanation": "It allows you to perform side effects from a function component."
    }], null, 2);

    return (
        <div className="w-full max-w-4xl mx-auto p-4 my-8 bg-slate-800 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Admin Panel</h2>
            
            <div className="mb-8 p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Question Bank Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-white">
                    {Object.keys(questionCounts).length > 0 ? Object.keys(questionCounts).map(track => (
                        <div key={track}>
                            <h4 className="font-bold capitalize">{track}</h4>
                            <ul className="text-sm list-disc list-inside">
                                {Object.keys(questionCounts[track]).map(level => (
                                    <li key={level}><span className="capitalize">{level}</span>: {questionCounts[track][level]}</li>
                                ))}
                            </ul>
                        </div>
                    )) : <p className="text-slate-400 col-span-full">No questions found. Seed or upload quizzes to begin.</p>}
                </div>
            </div>

            <div className="mb-8 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Configure Timers (in seconds)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Total Quiz Time</label>
                        <input type="number" value={totalTime} onChange={(e) => setTotalTime(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-700 bg-slate-900 rounded-md text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Time Per Question</label>
                        <input type="number" value={questionTime} onChange={(e) => setQuestionTime(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-slate-700 bg-slate-900 rounded-md text-white" />
                    </div>
                </div>
                <button onClick={handleSaveTimers} disabled={isSubmitting} className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500">
                    {isSubmitting ? 'Saving...' : 'Save Timer Settings'}
                </button>
            </div>

            <div className="space-y-4 text-white mb-8 pt-8 border-t border-slate-700">
                 <h3 className="text-xl font-semibold">Upload Quiz File (CSV/JSON)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Target Track</label>
                        <select value={fileTrack} onChange={(e) => setFileTrack(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-slate-700 bg-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                            <option value="react">React</option>
                            <option value="devops">DevOps</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Target Level</label>
                        <select value={fileLevel} onChange={(e) => setFileLevel(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-slate-700 bg-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Quiz File</label>
                    <input type="file" accept=".csv, .json" onChange={handleFileUpload} className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                 </div>
                 <button onClick={processAndUploadFile} disabled={isSubmitting || !file} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500">
                    {isSubmitting ? 'Uploading...' : 'Upload from File'}
                 </button>
            </div>
            
            <div className="mb-8 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Download Templates</h3>
                <div className="flex gap-4">
                    <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvTemplate)}`} download="sample_quizzes.csv" className="flex-1 text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Download CSV Template
                    </a>
                    <a href={`data:application/json;charset=utf-8,${encodeURIComponent(jsonTemplate)}`} download="sample_quizzes.json" className="flex-1 text-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Download JSON Template
                    </a>
                </div>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4 text-white pt-8 border-t border-slate-700">
                <h3 className="text-xl font-semibold">Create Single Quiz Question</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Track</label>
                        <select value={manualTrack} onChange={(e) => setManualTrack(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-slate-700 bg-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                            <option value="react">React</option>
                            <option value="devops">DevOps</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Level</label>
                        <select value={manualLevel} onChange={(e) => setManualLevel(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-slate-700 bg-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
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
                 <div>
                    <label className="block text-sm font-medium text-slate-300">Explanation</label>
                    <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows="2" className="mt-1 block w-full shadow-sm sm:text-sm border-slate-700 bg-slate-900 rounded-md"></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-500">
                    {isSubmitting ? 'Submitting...' : 'Add Question'}
                </button>
                {adminMessage.text && <p className={`text-center text-sm mt-2 ${adminMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{adminMessage.text}</p>}
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
const TrackSelection = ({ onStartTest, userId }) => {
    const tracks = [
        { id: 'javascript', name: 'JavaScript', color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
        { id: 'python', name: 'Python', color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
        { id: 'sql', name: 'SQL', color: 'bg-teal-500', hover: 'hover:bg-teal-600' },
        { id: 'react', name: 'React', color: 'bg-sky-500', hover: 'hover:bg-sky-600' },
        { id: 'devops', name: 'DevOps', color: 'bg-gray-500', hover: 'hover:bg-gray-600' },
    ];
    const levels = ['Beginner', 'Intermediate', 'Expert'];

    const [selectedTrack, setSelectedTrack] = useState(null);
    const [attemptedQuizzes, setAttemptedQuizzes] = useState(new Set());
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoadingHistory(false);
            return;
        };

        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            const historyCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'progress');
            const querySnapshot = await getDocs(historyCollectionRef);
            const attempts = new Set();
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.track && data.level) {
                    const quizId = `${data.track.toLowerCase()}_${data.level.toLowerCase()}`;
                    attempts.add(quizId);
                }
            });
            setAttemptedQuizzes(attempts);
            setIsLoadingHistory(false);
        };

        fetchHistory();
    }, [userId]);

    return (
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
                            {isLoadingHistory ? (
                                <p className="text-slate-400">Loading history...</p>
                            ) : (
                                levels.map(level => {
                                    const quizId = `${selectedTrack.toLowerCase()}_${level.toLowerCase()}`;
                                    const isAttempted = attemptedQuizzes.has(quizId);
                                    return (
                                        <button 
                                            key={level} 
                                            onClick={() => onStartTest(selectedTrack, level)} 
                                            disabled={isAttempted}
                                            className={`bg-indigo-600 text-white font-semibold py-4 px-8 rounded-lg transition-transform duration-200 shadow-lg w-full md:w-auto ${
                                                isAttempted 
                                                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                                                : 'hover:bg-indigo-700 hover:scale-105'
                                            }`}
                                        >
                                            {isAttempted ? 'Attempted' : level}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Quiz = ({ db, track, level, onFinish }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    
    const [timerConfig, setTimerConfig] = useState({ total: DEFAULT_TOTAL_QUIZ_TIME, perQuestion: DEFAULT_TIME_PER_QUESTION });
    const [totalTime, setTotalTime] = useState(DEFAULT_TOTAL_QUIZ_TIME);
    const [questionTime, setQuestionTime] = useState(DEFAULT_TIME_PER_QUESTION);
    const [isPaused, setIsPaused] = useState(false);
    const [isTimeWarning, setIsTimeWarning] = useState(false);

    const handleFinishQuiz = useCallback((switchedTabs = false) => {
        let score = 0;
        for (let i = 0; i < questions.length; i++) {
            if (selectedAnswers[i] === questions[i].correctAnswer) {
                score++;
            }
        }
        onFinish(score, questions.length, questions, selectedAnswers, switchedTabs);
    }, [questions, selectedAnswers, onFinish]);

    const handleNext = useCallback(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsTimeWarning(false);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionTime(timerConfig.perQuestion);
        } else {
            handleFinishQuiz();
        }
    }, [currentQuestionIndex, questions.length, handleFinishQuiz, timeoutId, timerConfig.perQuestion]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleFinishQuiz(true);
            }
        };

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'Are you sure you want to leave? Your quiz will be submitted.';
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [handleFinishQuiz]);

    useEffect(() => {
        if(questions.length === 0 || isPaused) return;

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
                if (prev <= 6) setIsTimeWarning(true);
                if (prev <= 1) {
                    handleNext();
                    return timerConfig.perQuestion;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [questions, isPaused, handleFinishQuiz, handleNext, timerConfig.perQuestion]);

    useEffect(() => {
        const fetchQuizData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const timerConfigRef = doc(db, 'settings', 'timers');
                const timerConfigSnap = await getDoc(timerConfigRef);
                const newTimerConfig = timerConfigSnap.exists()
                    ? { total: timerConfigSnap.data().totalQuizTime, perQuestion: timerConfigSnap.data().timePerQuestion }
                    : { total: DEFAULT_TOTAL_QUIZ_TIME, perQuestion: DEFAULT_TIME_PER_QUESTION };
                
                setTimerConfig(newTimerConfig);
                setTotalTime(newTimerConfig.total);
                setQuestionTime(newTimerConfig.perQuestion);

                const quizId = `${track.toLowerCase()}_${level.toLowerCase()}`;
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'quizzes', quizId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().questions.length > 0) {
                    const shuffledQuestions = [...docSnap.data().questions].sort(() => Math.random() - 0.5);
                    setQuestions(shuffledQuestions);
                } else {
                    setError(`No quiz found for ${track} - ${level}. Please seed the database or ask an admin to add questions.`);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load quiz data. Please check your connection and try again.");
            }
            setIsLoading(false);
        };
        fetchQuizData();
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
    
    const totalTimePercentage = (totalTime / timerConfig.total) * 100;
    const questionTimePercentage = (questionTime / timerConfig.perQuestion) * 100;

    const getProgressBarColor = (percentage) => {
        if (percentage > 50) return 'bg-green-500';
        if (percentage > 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
            <div className="bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl">
                <div className="mb-6">
                     <div className="flex justify-between items-center mb-1 text-slate-300">
                        <div className="text-sm">Total Time Left</div>
                         <div className="text-sm font-bold text-white">
                            {Math.floor(totalTime / 60)}:{('0' + totalTime % 60).slice(-2)}
                        </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ease-linear ${getProgressBarColor(totalTimePercentage)}`}
                            style={{ width: `${totalTimePercentage}%` }}
                        ></div>
                    </div>

                     <div className="flex justify-between items-center mb-1 text-slate-300">
                        <div className="text-sm">Time for this Question</div>
                        <div className={`text-sm font-bold ${isTimeWarning ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {questionTime}s
                        </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                        <div 
                             className={`h-2.5 rounded-full transition-all duration-500 ease-linear ${getProgressBarColor(questionTimePercentage)} ${isTimeWarning ? 'animate-pulse' : ''}`}
                             style={{ width: `${questionTimePercentage}%` }}
                        ></div>
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

const Results = ({ db, userId, track, level, score, totalQuestions, onRestart, questions, selectedAnswers, switchedTabs }) => {
    const percentage = Math.round((score / totalQuestions) * 100);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        const saveResult = async () => {
            if (!userId) return;
            try {
                const resultsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'progress');
                await addDoc(resultsCollectionRef, { track, level, score, totalQuestions, percentage, completedAt: new Date(), switchedTabs: switchedTabs || false });
            } catch (error) {
                console.error("Error saving result: ", error);
            }
        };
        saveResult();
    }, [db, userId, track, level, score, totalQuestions, percentage, switchedTabs]);
    
    let feedback = {
        title: "Great Effort!",
        message: "Keep practicing to master this skill.",
        color: "text-yellow-400"
    };
    if (switchedTabs) {
        feedback = { title: "Quiz Incomplete", message: "The quiz was automatically submitted because you switched to another tab or window.", color: "text-red-400" };
    } else if (percentage >= 80) {
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
                                {q.explanation && <p className="text-sm text-slate-400 mt-2"><em>Explanation:</em> {q.explanation}</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AppHeader = ({ user, onSignOut, onNavigate, isAdmin }) => (
    <header className="bg-slate-800 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => onNavigate('home')}>Skill Index</h1>
            <div className="flex items-center gap-4">
                {!isAdmin && <button onClick={() => onNavigate('history')} className="text-sm text-slate-300 hover:text-white">Quiz History</button>}
                {isAdmin && <button onClick={() => onNavigate('analytics')} className="text-sm text-slate-300 hover:text-white">Analytics</button>}
                <span className="text-sm text-slate-300">{user.email}</span>
                <button onClick={onSignOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                    Sign Out
                </button>
            </div>
        </div>
    </header>
);

const AdminDashboard = ({ onSeedDatabase, seeding, seeded }) => {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-slate-400 text-lg">Manage quizzes and application data.</p>
            </div>
            <AdminPanel onSeedDatabase={onSeedDatabase} seeding={seeding} seeded={seeded} />
        </div>
    );
};

const QuizHistory = ({ userId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!userId) return;
            setLoading(true);
            const historyCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'progress');
            const q = query(historyCollectionRef, orderBy("completedAt", "desc"));
            const querySnapshot = await getDocs(q);
            const historyData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHistory(historyData);
            setLoading(false);
        };
        fetchHistory();
    }, [userId]);

    if(loading) return <div className="text-white text-center p-10">Loading History...</div>

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">Quiz History</h1>
            <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
                <table className="min-w-full text-white">
                    <thead className="bg-slate-700">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Track</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Level</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Score</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Percentage</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {history.length > 0 ? history.map(item => (
                            <tr key={item.id}>
                                <td className="py-4 px-4 capitalize">{item.track}</td>
                                <td className="py-4 px-4 capitalize">{item.level}</td>
                                <td className="py-4 px-4">{item.score}/{item.totalQuestions}</td>
                                <td className="py-4 px-4">{item.percentage}%</td>
                                <td className="py-4 px-4">{new Date(item.completedAt.seconds * 1000).toLocaleDateString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-8 text-slate-400">You haven't completed any quizzes yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const calculateStats = useCallback(async () => {
        setLoading(true);
        const usersCollectionRef = collection(db, 'artifacts', appId, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);
        
        let allProgress = [];
        for (const userDoc of usersSnapshot.docs) {
            const progressCollectionRef = collection(db, 'artifacts', appId, 'users', userDoc.id, 'progress');
            const progressSnapshot = await getDocs(progressCollectionRef);
            progressSnapshot.forEach(doc => {
                allProgress.push({ userId: userDoc.id, ...doc.data() });
            });
        }

        if (allProgress.length === 0) {
            setStats({
                totalQuizzes: 0, averageScore: 0, passRate: 0,
                popularTracks: {}, topPerformers: []
            });
            setLoading(false);
            return;
        }

        const totalQuizzes = allProgress.length;
        const totalPercentage = allProgress.reduce((sum, p) => sum + p.percentage, 0);
        const averageScore = totalPercentage / totalQuizzes;
        const passedQuizzes = allProgress.filter(p => p.percentage >= 60).length;
        const passRate = (passedQuizzes / totalQuizzes) * 100;

        const popularTracks = allProgress.reduce((acc, p) => {
            acc[p.track] = (acc[p.track] || 0) + 1;
            return acc;
        }, {});

        const userScores = allProgress.reduce((acc, p) => {
            if (!acc[p.userId]) {
                acc[p.userId] = { totalScore: 0, count: 0, email: 'N/A' };
            }
            acc[p.userId].totalScore += p.percentage;
            acc[p.userId].count += 1;
            return acc;
        }, {});

        const topPerformers = Object.entries(userScores)
            .map(([userId, data]) => ({
                userId,
                average: data.totalScore / data.count,
                quizzesTaken: data.count
            }))
            .sort((a, b) => b.average - a.average)
            .slice(0, 5);

        setStats({
            totalQuizzes,
            averageScore: averageScore.toFixed(2),
            passRate: passRate.toFixed(2),
            popularTracks,
            topPerformers
        });

        setLoading(false);
    }, []);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    const exportToCsv = () => {
        alert("Data export functionality would be implemented here.");
    };

    if (loading) return <div className="text-white text-center p-10">Loading Analytics...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-medium">Total Quizzes Taken</h3>
                    <p className="text-3xl font-bold">{stats.totalQuizzes}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-medium">Average Score</h3>
                    <p className="text-3xl font-bold">{stats.averageScore}%</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-medium">Pass Rate (&gt;60%)</h3>
                    <p className="text-3xl font-bold">{stats.passRate}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-slate-800 p-6 rounded-xl">
                    <h3 className="font-semibold mb-4">Top Performers (by Avg. Score)</h3>
                    <ul>
                        {stats.topPerformers.map((p, i) => (
                            <li key={p.userId} className="flex justify-between items-center py-2 border-b border-slate-700">
                                <span>{i+1}. User {p.userId.substring(0,8)}...</span>
                                <span className="font-bold">{p.average.toFixed(2)}%</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                    <h3 className="font-semibold mb-4">Most Popular Tracks</h3>
                     <ul>
                        {Object.entries(stats.popularTracks).sort(([,a],[,b]) => b-a).map(([track, count]) => (
                            <li key={track} className="flex justify-between items-center py-2 border-b border-slate-700">
                                <span className="capitalize">{track}</span>
                                <span className="font-bold">{count} attempts</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
             <div className="mt-8 text-center">
                <button onClick={exportToCsv} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                    Export All User Data (CSV)
                </button>
            </div>
        </div>
    );
};

const ConsentModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-lg w-full text-white">
            <h2 className="text-2xl font-bold mb-4">Quiz Rules & Consent</h2>
            <p className="text-slate-300 mb-6">
                Please read the following rules carefully before starting the test.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mb-8">
                <li>The quiz is timed, both for each question and for the overall test.</li>
                <li>You must remain in full-screen mode for the duration of the test.</li>
                <li>
                    Your test will be **automatically submitted** under the following conditions:
                </li>
                <li className="ml-4 font-semibold text-yellow-400">Exiting full-screen mode.</li>
                <li className="ml-4 font-semibold text-yellow-400">Switching to another browser tab or window.</li>
                <li className="ml-4 font-semibold text-yellow-400">Closing the browser tab or window.</li>
                <li className="ml-4 font-semibold text-yellow-400">Opening developer tools (F12).</li>
                <li className="ml-4 font-semibold text-yellow-400">Losing your internet connection.</li>
            </ul>
            <p className="text-slate-300 mb-6">
                Please ensure you have a stable connection and can focus for the duration of the test.
            </p>
            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                    Cancel
                </button>
                <button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                    Agree & Start Quiz
                </button>
            </div>
        </div>
    </div>
);


export default function App() {
    const [view, setView] = useState('home');
    const [quizConfig, setQuizConfig] = useState({ track: null, level: null });
    const [quizResult, setQuizResult] = useState({ score: 0, totalQuestions: 0, questions: [], selectedAnswers: {}, switchedTabs: false });
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [seeded, setSeeded] = useState(false);
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
    const [pendingQuizConfig, setPendingQuizConfig] = useState(null);
    
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

    const handleStartTestRequest = (track, level) => {
        setPendingQuizConfig({ track, level });
        setIsConsentModalOpen(true);
    };

    const handleConsentConfirm = () => {
        if (pendingQuizConfig) {
            // Enter fullscreen before starting the quiz
            document.documentElement.requestFullscreen().then(() => {
                setQuizConfig(pendingQuizConfig);
                setView('test');
            }).catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
        setIsConsentModalOpen(false);
        setPendingQuizConfig(null);
    };

    const handleConsentCancel = () => {
        setIsConsentModalOpen(false);
        setPendingQuizConfig(null);
    };

    const handleFinishTest = (score, totalQuestions, questions, selectedAnswers, switchedTabs = false, networkIssue = false) => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        setQuizResult({ score, totalQuestions, questions, selectedAnswers, switchedTabs, networkIssue });
        setView('results');
    };

    const handleRestart = () => {
        setView('home');
        setQuizConfig({ track: null, level: null });
        setQuizResult({ score: 0, totalQuestions: 0, questions: [], selectedAnswers: {}, switchedTabs: false });
    };
    
    const renderUserView = () => {
        switch (view) {
            case 'test':
                return <Quiz db={db} track={quizConfig.track} level={quizConfig.level} onFinish={handleFinishTest} />;
            case 'results':
                return <Results db={db} userId={user.uid} track={quizConfig.track} level={quizConfig.level} {...quizResult} onRestart={handleRestart} />;
            case 'history':
                return <QuizHistory userId={user.uid} />;
            case 'home':
            default:
                return <TrackSelection onStartTest={handleStartTestRequest} userId={user.uid} />;
        }
    };

    const renderAdminView = () => {
        switch (view) {
            case 'analytics':
                return <AnalyticsDashboard />;
            case 'home':
            default:
                return <AdminDashboard onSeedDatabase={handleSeedDatabase} seeding={seeding} seeded={seeded} />;
        }
    };

    if (!isAuthReady) {
        return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white text-2xl">Loading...</div>;
    }

    return (
        <div className="bg-slate-900 min-h-screen w-full font-sans">
            {isConsentModalOpen && <ConsentModal onConfirm={handleConsentConfirm} onCancel={handleConsentCancel} />}
            {!user ? (
                <AuthScreen />
            ) : (
                <>
                    <AppHeader user={user} onSignOut={handleSignOut} onNavigate={setView} isAdmin={isAdmin} />
                    <main className="flex items-center justify-center p-4">
                        <style>{`.prose-invert { --tw-prose-body: #d1d5db; --tw-prose-headings: #fff; --tw-prose-lead: #a1a1aa; --tw-prose-links: #fff; --tw-prose-bold: #fff; --tw-prose-counters: #a1a1aa; --tw-prose-bullets: #a1a1aa; --tw-prose-hr: #404040; --tw-prose-quotes: #f3f4f6; --tw-prose-quote-borders: #404040; --tw-prose-captions: #a1a1aa; --tw-prose-code: #fff; --tw-prose-pre-code: #d1d5db; --tw-prose-pre-bg: #1f2937; --tw-prose-th-borders: #404040; --tw-prose-td-borders: #374151; }`}</style>
                        <div className="w-full">
                           {isAdmin ? renderAdminView() : renderUserView()}
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}
