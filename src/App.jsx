import "./App.css";

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import AddStory from "./components/AddStory";
import ReadStory from "./pages/ReadStory";
import WonderShelf from "./pages/WonderShelf";
import WhoWeAre from "./pages/WhoWeAre";
import EditStory from "./components/EditStory";
import PageNotFound from "./components/PageNotFound";

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wonderShelf" element={<WonderShelf />} />
          <Route path="/addStory" element={<AddStory />} />
          <Route path="/editStory/:id" element={<EditStory />} />
          <Route path="/who-we-are" element={<WhoWeAre />} />
          {/* Route for reading the story */}
          {/* Updated route to handle dynamic story IDs */}
          <Route path="/readStory/:id" element={<ReadStory />} />
          {/* Placeholder route for individual story pages */}
          <Route
            path="/readStory/:id/page/:pageNumber"
            element={<div>Page View Placeholder</div>}
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
