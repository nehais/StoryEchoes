import { Link } from "react-router-dom";
import "../styles/Footer.css";
import githubLogo from "../assets/GitHub-logo.jpg";
import openIcon from "../assets/open.png";
import DeleteToast from "./DeleteToast.jsx";

const Footer = () => {
  return (
    <div className="footer">
      <Link to="https://github.com/nehais/StoryEchoes">
        <img src={githubLogo} alt="GitHub" className="github-logo" />
        <img src={openIcon} alt="Open Icon" className="open-icon" />
      </Link>

      {/*Show Delete Toast Message*/}
      <DeleteToast className="footer-toast"></DeleteToast>
    </div>
  );
};

export default Footer;
