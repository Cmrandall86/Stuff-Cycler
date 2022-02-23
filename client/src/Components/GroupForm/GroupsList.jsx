import React from "react";
import "../../CSS/GroupsList.css";
import GroupListItem from "./GroupListItem";
import { useEffect, useState } from "react";

function GroupsList({ onDeleteGroups }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/groups")
      .then((response) => response.json())
      .then((data) => setList(data)).catch((error)=>console.log(error));
  }, []);

  return (
    <div id="groupsListWrapper">
      <div id="groupsList">
        {list.map((group, index) => {
          return (
            <GroupListItem
              group={group}
              onDeleteGroups={() => onDeleteGroups(index)}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GroupsList;
