import PropTypes from "prop-types";
import ButtonComponent from "../Button";
import "@fontsource/roboto/300.css";
import { Link } from "react-router-dom";

const GroupListItem = ({ group, onDeleteGroups }) => {

  return (

    <div>
        <li key={group.index}>
          {`${group.groupName} has ${group.friends.length} friends `}

            <Link to={`/GroupForm/${group.id}/edit`} className="NavLink">
            <ButtonComponent text={"Edit"} onClicker={()=>{console.log(group)}}/>
            </Link>
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
