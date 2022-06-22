import React from "react";
import PropTypes from "prop-types";
import Input from "../Input";
import ButtonComponent from "../Button";
import DeleteIcon from "@mui/icons-material/Delete";
import { supabase } from "../../supabaseClient";
import { useEffect, useState } from "react";
import Checkbox from "@mui/material/Checkbox";


const FriendsList = () => {
  const [friends, setFriends] = useState([])
  useEffect(
    ()=>{
  
      const fetchFriends = async () => {
      const { data, error } = await supabase
        .from('profile_friends')
        .select(`
          id,
          profile:friend_id ( username )
        `)
        .eq('profile_id', supabase.auth.user().id)
        setFriends(data)
        console.log(data)
    }
  
      fetchFriends()
  
    },[]
    )

  const [isChecked, setIsChecked] = useState([true])  


  return (
    <div id="friends_list_wrapper">
      <h2 className="form_start_title">List of Friends</h2>

      <ul id="friend_list">
        {friends.map((friend, i) => {

          return (
            <li key={i}>
              {friend.profile.username}
              <Checkbox
              
              onChange={()=>{setIsChecked([...isChecked , isChecked[i] === true ? false : true])}}
              checked={isChecked[i]}
              />
              <ButtonComponent
                text="Delete"
                color="red"
                onClicker={() => {}}
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
