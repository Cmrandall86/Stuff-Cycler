import React, { useEffect, useState } from "react";
import "../../CSS/GroupForm.css";
import FriendForm from "./FriendForm";
import ButtonComponent from "../Button";
import Input from "../Input";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import Card from "../Card";
import FriendsList from "./FriendsList";
import styled from 'styled-components'
import { supabase } from "../../supabaseClient";

function GroupForm(props) {
  const [group, setGroup] = useState({
    groupName: "",
    friends: [],
  });

  //#region GroupForm Handler Functions

  useEffect(
  ()=>{

    const fetchFriends = async () => {
    const { data, error } = await supabase
      .from('profile_friends')
      .select(`
        id,
        friend:friend_id ( username )
      `)
      .eq('profile_id', supabase.auth.user().id)
  }

    fetchFriends()

  },[]
  )


  function handleSetGroupName(e) {
    const groupName = e.target.value;
    setGroup({ ...group, groupName });
  }




  function handleSubmitGroup(e) {
    e.preventDefault();

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
          </div>
        }
      />

      {
        //#endregion
      }
      <Card element={  <FriendsList group={group} setGroup={setGroup} />
 }/>
     

      <Outlet />
    </div>
  );
}

export default GroupForm;


