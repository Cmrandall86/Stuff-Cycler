import React from "react";
import PropTypes from "prop-types";
import Input from "../Input";
import ButtonComponent from "../Button";
import DeleteIcon from "@mui/icons-material/Delete";

const FriendsList = ({ group, setGroup }) => {
  function handleSetEditNames(e, index) {
    const nameValue = e.target.value;
    const nameKey = e.target.name;

    setGroup({
      ...group,
      friends: [
        ...group.friends.slice(0, index),
        { ...group.friends[index], [nameKey]: nameValue },
        ...group.friends.slice(index + 1),
      ],
    });
  }

  function setPersonToDisplayMode(i) {
    const personTarget = group.friends[i];
    const newfriends = [
      ...group.friends.slice(0, i),
      { ...personTarget, isEditing: false },
      ...group.friends.slice(i + 1),
    ];

    setGroup({
      ...group,
      friends: newfriends,
    });
  }

  function handleDeleteName(i) {
    setGroup({
      ...group,
      friends: [...group.friends.slice(0, i), ...group.friends.slice(i + 1)],
    });
  }

  function setPersonToEditMode(i) {
    const personTarget = group.friends[i];
    const editedFriendsArray = [
      ...group.friends.slice(0, i),
      { ...personTarget, isEditing: true },
      ...group.friends.slice(i + 1),
    ];

    setGroup({
      ...group,
      friends: editedFriendsArray,
    });
  }

  return (
    <div id="friends_list_wrapper">
      <h2 className="form_start_title">List of Friends</h2>

      <ul id="friend_list">
        {group.friends.map((friend, i) => {
          if (friend.isEditing) {
            return (
              <div className="friend_wrapper">
                <li key={i}>
                  <Input
                    Name={"firstName"}
                    Placeholder={"First Name"}
                    Type={"text"}
                    Value={friend.firstName}
                    Label={"First Name: "}
                    onChange={(e) => handleSetEditNames(e, i)}
                  />
                  <Input
                    Name={"lastName"}
                    Placeholder={"Last Name"}
                    Type={"text"}
                    Value={friend.lastName}
                    Label={"Last Name: "}
                    onChange={(e) => handleSetEditNames(e, i)}
                  />
                  <ButtonComponent
                    text="Save"
                    color="#00FFFF"
                    onClicker={() => setPersonToDisplayMode(i)}
                  />
                </li>
              </div>
            );
          }

          return (
            <li key={i}>
              {friend.firstName} {friend.lastName}
              <ButtonComponent
                color="#00FFFF"
                text="Edit"
                onClicker={() => setPersonToEditMode(i)}
              />
              <ButtonComponent
                text="Delete"
                color="red"
                onClicker={() => handleDeleteName(i)}
                startIcon={<DeleteIcon />}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

FriendsList.propTypes = {};

export default FriendsList;
