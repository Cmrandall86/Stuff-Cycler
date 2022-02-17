import PropTypes from "prop-types";
import ButtonComponent from "../Button";
import "@fontsource/roboto/300.css";
import { useNavigate } from "react-router-dom";

const GroupListItem = ({ group, onDeleteGroups }) => {
  const navigate = useNavigate();
  return (
    <div>
      <li key={group.index}>
        {`${group.groupName} has ${group.friends.length} friends `}

        <ButtonComponent
          text={"Edit"}
          onClicker={() => {
            navigate(`/GroupForm/${group.id}/edit`);
          }}
        />

        <ButtonComponent
          color={"red"}
          text={"Delete"}
          onClicker={onDeleteGroups}
        />
      </li>
    </div>
  );
};

GroupListItem.propTypes = {};

export default GroupListItem;
