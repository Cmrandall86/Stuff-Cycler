import "@fontsource/roboto/300.css";
import Checkbox from "@mui/material/Checkbox";

const PostGroupItem = ({ group, handleSelectGroup, isSelected, index }) => {
  return (
      <li className="PostGroupItem">
        <Checkbox
          aria-label="PostCheckBox"
          onChange={()=> handleSelectGroup(group.id)}
          checked={isSelected}
        />
        {`${group.groupName}`}
        This checkbox is {isSelected ? "checked" : "unchecked"}.
        
      </li>
  );
};

export default PostGroupItem;
