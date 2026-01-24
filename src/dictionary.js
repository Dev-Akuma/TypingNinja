// src/dictionary.js

const WORDS = [
    // 1-2 Letters (Speed inputs)
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "IF", "IT", "IS", "GO", "TO", "DO", "NO", "UP", "AT", "ON", "IN", "MY", "WE", "OR", "OF", "BY", "AS", "BE", "ME", "HE", "SO", "US", "AM", "AN", "OX",
    
    // 3-4 Letters
    "VAR", "LET", "INT", "FOR", "MAP", "SET", "GET", "NEW", "TRY", "LOG", 
    "BIT", "BYTE", "CHAR", "NULL", "VOID", "TRUE", "CASE", "ELSE", "THIS",
    "CODE", "DATA", "FILE", "READ", "SAVE", "LOAD", "TYPE", "NODE", "LIST",
    
    // 5-7 Letters
    "CONST", "WHILE", "AWAIT", "ASYNC", "CLASS", "SUPER", "THROW", "CATCH",
    "REACT", "STATE", "PROPS", "HOOKS", "EFFECT", "MOUNT", "BUILD", "DEBUG",
    "EXPORT", "IMPORT", "RETURN", "SWITCH", "STRING", "NUMBER", "OBJECT",
    
    // 8+ Letters (Boss words)
    "FUNCTION", "VARIABLE", "CONSTANT", "COMPONENT", "INTERFACE", "UNDEFINED",
    "PROMISE", "CALLBACK", "ARGUMENT", "STATEMENT", "RECURSION", "ALGORITHM",
    "ATTRIBUTE", "ELEMENT", "LISTENER", "OBSERVER", "OPERATOR", "FRAMEWORK"
];

export const getRandomWord = (min, max) => {
    // Filter the pool based on the game's current requirements
    const pool = WORDS.filter(w => w.length >= min && w.length <= max);
    
    // Fallback if settings are too strict (e.g., min 20 letters)
    if(pool.length === 0) return "NINJA";
    
    return pool[Math.floor(Math.random() * pool.length)];
};