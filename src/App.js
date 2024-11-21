import React, { useState, useRef } from 'react';
import { Play, Pause, Save, Plus, Trash2, SkipBack, Volume2 } from 'lucide-react';

const BatchAudioSync = () => {
  const [pages, setPages] = useState([{
    id: 1,
    text: '',
    audioFile: null,
    audioUrl: null,
    words: [],
    timestamps: {},
    isPlaying: false,
    currentTime: 0
  }]);
  
  const audioRef = useRef(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [activePage, setActivePage] = useState(1);
  const [volume, setVolume] = useState(1);

  const handleAudioTimeUpdate = () => {
    const time = audioRef.current?.currentTime || 0;
    setPages(pages.map(page => {
      if (page.id === activePage) {
        return { ...page, currentTime: time };
      }
      return page;
    }));
  };

  const markWordTiming = (pageId, wordId) => {
    const time = audioRef.current?.currentTime || 0;
    setPages(pages.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          timestamps: {
            ...page.timestamps,
            [wordId]: time.toFixed(2)
          }
        };
      }
      return page;
    }));
    setCurrentWordIndex(wordId);
  };

  const updatePageAudio = (pageId, file) => {
    const url = URL.createObjectURL(file);
    setPages(pages.map(page => {
      if (page.id === pageId) {
        return { ...page, audioFile: file, audioUrl: url };
      }
      return page;
    }));
    if (audioRef.current) {
      audioRef.current.src = url;
    }
  };

  const handlePlayPause = (pageId) => {
    setPages(pages.map(page => {
      if (page.id === pageId) {
        if (page.isPlaying) {
          audioRef.current?.pause();
        } else {
          audioRef.current?.play();
        }
        return { ...page, isPlaying: !page.isPlaying };
      }
      return { ...page, isPlaying: false };
    }));
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentWordIndex(-1);
    }
  };

  const addPage = () => {
    setPages([...pages, {
      id: pages.length + 1,
      text: '',
      audioFile: null,
      audioUrl: null,
      words: [],
      timestamps: {},
      isPlaying: false,
      currentTime: 0
    }]);
  };

  const removePage = (pageId) => {
    setPages(pages.filter(page => page.id !== pageId));
  };

  const updatePageText = (pageId, text) => {
    setPages(pages.map(page => {
      if (page.id === pageId) {
        const words = text.trim().split(/\s+/).map((word, index) => ({
          id: index,
          text: word,
          timestamp: null
        }));
        return { ...page, text, words };
      }
      return page;
    }));
  };

  const exportAllTimings = () => {
    const exportData = pages.map(page => ({
      pageNumber: page.id,
      words: page.words.map(word => ({
        text: word.text,
        timestamp: page.timestamps[word.id] || null
      }))
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-page-timings.json';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audio Text Synchronization Tool</h1>
        <button
          onClick={addPage}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      {pages.map(page => (
        <div key={page.id} className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Page {page.id}</h2>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500">Click words while audio plays to mark timestamps</span>
              <button
                onClick={() => removePage(page.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <textarea
            className="w-full h-32 p-2 border rounded text-right"
            placeholder="Paste Hebrew text here..."
            value={page.text}
            onChange={(e) => updatePageText(page.id, e.target.value)}
            dir="rtl"
          />

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => updatePageAudio(page.id, e.target.files?.[0])}
                className="border rounded p-2"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayPause(page.id)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                title={page.isPlaying ? "Pause" : "Play"}
              >
                {page.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button
                onClick={resetAudio}
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                title="Reset"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume;
                    }
                  }}
                  className="w-24"
                  title="Volume"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2" dir="rtl">
            {page.words.map((word) => (
              <button
                key={word.id}
                onClick={() => markWordTiming(page.id, word.id)}
                className={`p-2 rounded ${
                  page.timestamps[word.id] 
                    ? 'bg-green-100 hover:bg-green-200' 
                    : currentWordIndex === word.id
                    ? 'bg-blue-100 hover:bg-blue-200'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Click to mark timestamp"
              >
                {word.text}
                {page.timestamps[word.id] && (
                  <span className="block text-xs text-gray-500" dir="ltr">
                    {page.timestamps[word.id]}s
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={() => {
          setPages(pages.map(page => ({ ...page, isPlaying: false })));
          setCurrentWordIndex(-1);
        }}
        className="hidden"
      />

      <button
        onClick={exportAllTimings}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
      >
        <Save className="w-5 h-5" />
        Export Timings
      </button>
    </div>
  );
};

export default BatchAudioSync;