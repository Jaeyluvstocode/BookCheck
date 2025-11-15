import React from "react";
import "./Home.css";

export default function Home({ setView }) {
  return (
    <div className="home-container">
      <div className="home-hero" role="img" aria-label="Books on a shelf background">
        <div className="home-hero-inner container">
          <div className="home-hero-media" aria-hidden="true">
            {/* decorative image, kept in CSS as background for performance */}
          </div>
          <div className="home-hero-copy">
            
            <h1>Your Next Favorite Book is Waiting</h1>
            <p>
              Dive into a world of stories! With BookCheck, you can discover trending books,
              track your reading journey, write reviews, and connect with fellow book lovers
              worldwide. Whether you love mysteries, fantasy, or non-fiction, there's always
              something new to explore.
            </p>
            <p>
              Join our vibrant community, get personalized recommendations, and never run out
              of books to read. Your next literary adventure is just a click away!
            </p>
            <button className="cta explore-btn" onClick={() => setView("register")}>
              Explore Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
