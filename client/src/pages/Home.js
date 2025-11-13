import React from "react";
import "./Home.css";

export default function Home({ setView }) {
  return (
    <div className="home-container">
      <div className="overlay">
        <div className="home-content">
          <h1>Your Next Favorite Book is Waiting</h1>
          <p>
            Discover and review amazing books. Join the BookCheck community to
            share your thoughts, explore genres, and find your next favorite read.
          </p>
          <button className="explore-btn" onClick={() => setView("register")}>
            Explore Now
          </button>
        </div>
      </div>
    </div>
  );
}
