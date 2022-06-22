import React from "react";
import "../../CSS/GroupsList.css";
import GroupListItem from "./GroupListItem";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function GroupsList() {
  const [groupNames, setGroupNames] = useState([]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("id, groupName");

      if (error) {
        throw new Error(error);
      }

      setGroupNames(data);
    } catch (err) {
      alert("Something Went Wrong With The Get Request", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onDeleteGroups = async (id) => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .delete()
        .match({ id: id });

      if (error) {
        throw new Error(error);
      }

      await fetchGroups();

    } catch (err) {
      alert("Something Went Wrong While Deleting", err);
    }
  };

  return (
    <div id="groupsListWrapper">
      <div id="groupsList">
        {groupNames.map((group, index) => {
          return (
            <GroupListItem
              group={group}
              onDeleteGroups={() => onDeleteGroups(group.id)}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GroupsList;
