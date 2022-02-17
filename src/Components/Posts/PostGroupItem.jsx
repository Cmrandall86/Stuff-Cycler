import ButtonComponent from "../Button";
import "@fontsource/roboto/300.css";
// import { Link } from "react-router-dom";
import Checkbox from "@mui/material/Checkbox";

const PostGroupItem = ({ group }) => {
  return (
    <div className="PostGroupItem">
      <li key={group.index}>
        <Checkbox aria-label="PostCheckBox" />
        {`${group.groupName} has ${group.friends.length} friends `}
      </li>
    </div>
  );
};

export default PostGroupItem;
