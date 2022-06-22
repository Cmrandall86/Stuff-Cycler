import "@fontsource/roboto/300.css";
import Checkbox from "@mui/material/Checkbox";

const PostGroupItem = ({ group, handleSelectGroup, selectedGroups, index }) => {
  return (
      <li className="PostGroupItem">
        <Checkbox
          aria-label="PostCheckBox"
          onChange={()=> handleSelectGroup(index)}
          checked={selectedGroups[index]}
        />
        {`${group.groupName}`}
        This checkbox is {selectedGroups[index] ? "checked" : "unchecked"}.
        
      </li>
  );
};

export default PostGroupItem;
