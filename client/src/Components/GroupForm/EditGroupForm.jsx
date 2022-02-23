import React, { useState, useEffect } from "react";
import "../../CSS/GroupForm.css";
import FriendForm from "./FriendForm";
import ButtonComponent from "../Button";
import Input from "../Input";
import DeleteIcon from "@mui/icons-material/Delete";
import { Outlet, useNavigate, useParams } from "react-router-dom";

function EditGroupForm(props) {
  const [group, setGroup] = useState({
    groupName: "",
    friends: [],

    isEditing: false,
  });

  let params = useParams();

  useEffect(() => {
    console.log(params.id)
    fetch(`http://localhost:8000/groups/${params.id}`)
      .then((response) => response.json())
      .then((data) => setGroup(data));
  }, []);

  console.log(group)
  let navigate = useNavigate();

  //#region GroupForm Handler Functions

  function handleSetGroupName(e) {
    const groupName = e.target.value;
    setGroup({ ...group, groupName });
  }

  function handleSetFriends(friend) {
    console.log(group);
    setGroup({ ...group, friends: [...group.friends, friend] });
  }

  //#endregion

  //#region Edit/Save Button Handler Functions
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

  function handleDeleteName(i) {
    setGroup({
      ...group,
      friends: [...group.friends.slice(0, i), ...group.friends.slice(i + 1)],
    });
  }

  function handleSubmitGroup(e) {
    e.preventDefault();
    props.onSubmitGroups(group);
    navigate("/GroupsList");
  }

  //#endregion

  return (
    <div id="group_form_wrapper">
      {
        //#region Group Form
      }

      <div id="group_wrapper">
        <h2 className="form_start_title">Edit Group</h2>
        <form onSubmit={handleSubmitGroup} id="groupForm">
          <Input
            Name={"group"}
            Placeholder={"Group Name"}
            Type={"text"}
            Value={group.groupName}
            Label={"Group Name: "}
            onChange={handleSetGroupName}
          />
          <ButtonComponent
            text="Save Group"
            onClicker={handleSubmitGroup}
            disabled={!group.groupName || group.friends.length}
          />
        </form>
        <FriendForm onSubmitFriend={handleSetFriends} />
      </div>

      {
        //#endregion
      }

      {
        //#region Edit Friends List
      }

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
      {
        //#endregion
      }
      <Outlet />
    </div>
  );
}

export default EditGroupForm;
