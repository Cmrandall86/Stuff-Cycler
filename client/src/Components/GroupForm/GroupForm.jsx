import React, { useState } from "react";
import "../../CSS/GroupForm.css";
import FriendForm from "./FriendForm";
import ButtonComponent from "../Button";
import Input from "../Input";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import Card from "../Card";
import FriendsList from "./FriendsList";

function GroupForm(props) {
  const [group, setGroup] = useState({
    groupName: "",
    friends: [],
    isEditing: false
  });

  // [
  //   { firstName: "Chris", lastName: "Randall", isEditing: false },
  //   { firstName: "Evan", lastName: "McJiggity", isEditing: false },
  // ],
  

  let params = useParams();
  let navigate = useNavigate();

  //#region GroupForm Handler Functions

  function handleSetGroupName(e) {
    const groupName = e.target.value;
    setGroup({ ...group, groupName });
  }

  function handleSetFriends(friend) {
    setGroup({ ...group, friends: [...group.friends, friend] });
  }

  function handleSubmitGroup(e) {
    e.preventDefault();
    props.onSubmitGroups(group);
    navigate('/GroupsList')
  }
  //#endregion


  return (
    <div id="group_form_wrapper">
      {
        //#region Group Form
      }
      <Card
        element={
          <div id="group_wrapper">
            <h2 className="form_start_title">Please Make A Group To Start</h2>
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
                disabled={!group.groupName || group.friends.length === 0}
              />{" "}
              {/* this evaluates to 0 if true */}
            </form>
            <FriendForm onSubmitFriend={handleSetFriends} />
          </div>
        }
      />

      {
        //#endregion
      }
      <Card element={  <FriendsList group ={group} setGroup={setGroup} />
 }/>
     

      <Outlet />
    </div>
  );
}

export default GroupForm;
