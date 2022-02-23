import React, { useState } from "react";
import ButtonComponent from "../Button"
import Input from "../Input";



function FriendForm(props) {
  const [friend, setFriend] = useState({
    firstName: "",
    lastName: "",
    isEditing: false,
  });

  function handleSetFriendFirstName(e) {
    const firstName = e.target.value;
    setFriend({ ...friend, firstName });
  }

  function handleSetFriendLastName(e) {
    const lastName = e.target.value;
    setFriend({ ...friend, lastName });
  }

  function handleSetFriend(e) {
    e.preventDefault();
    props.onSubmitFriend(friend);
  }

  return (
    <form onSubmit={handleSetFriend} id="FriendForm">
      <Input
        Name={"firstName"}
        id="friendFirstName"
        Placeholder={"First Name"}
        Type={"text"}
        Value={friend.firstName}
        Label={"First Name: "}
        onChange={handleSetFriendFirstName}
      />

      <Input
        Name={"lastName"}
        id="friendLastName"
        Placeholder={"Last Name"}
        Type={"text"}
        Value={friend.lastName}
        Label={"Last Name: "}
        onChange={handleSetFriendLastName}
      />

      <ButtonComponent text="Add Friend" color="blue" onClicker={handleSetFriend} />
    </form>
  );
}

export default FriendForm;
