import React from "react";
import "../../CSS/GroupsList.css";
import GroupListItem from "./GroupListItem";

function GroupsList({ list, onDeleteGroups }) {

  return (
    <div id="groupsListWrapper">
      <div id="groupsList">
        {list.map((group, index) => {
          return <GroupListItem group={group} onDeleteGroups={()=>onDeleteGroups(index)} key={index} />;
        })}
      </div>
    </div>
  );
}

export default GroupsList;

