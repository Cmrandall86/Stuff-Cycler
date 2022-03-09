import React, { useState, useEffect } from "react";
import "../../CSS/GroupForm.css";
import ButtonComponent from "../Button";
import Input from "../Input"
import {useNavigate , useParams} from "react-router-dom";
import Card from "../Card";
import PostGroups from "./PostGroups"

function EditPostForm(props) {
  const [post, setPost] = useState({
     title: "", description: "", 

    isEditing: false,
  });
  const [list, setList] = useState([]);

  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/groups")
      .then((response) => response.json())
      .then((data) =>{
        setList(data)
        setSelectedGroups(new Array(data.length).fill(false))
      })
      .catch((error) => console.log(error));
  }, []);

  // const selectedGroupData = selectedGroups
  // .map((isSelected, index) => {
  //   if (isSelected === true) {
  //     return list[index].id;
  //   }
  //   return false;
  // })
  // .filter((data) => data !== false);

  // const handleSelectGroup = (position) => {
  //   const updatedCheckedState = selectedGroups.map((item, index) =>
  //     index === position ? !item : item
  //   );

  //   setSelectedGroups(updatedCheckedState);
  // };


  let params = useParams();

  useEffect(() => {
 
    fetch(`http://localhost:8000/posts/${params.id}`)
      .then((response) => response.json())
      .then((data) => setPost(data));
  }, []);

  console.log(post)

  let navigate = useNavigate()

  const handleSetPost = (e, i) => {
    const nameValue = e.target.value;
    const nameKey = e.target.name;

    setPost({
      ...post,
      [nameKey]: nameValue,
    });
  };

  // const onSubmitPosts = (post) => {
  //   fetch(`http://localhost:8000/posts`, {
  //     method: "POST",
  //     body: JSON.stringify(post),
  //     headers: { "Content-Type": "application/json" },
  //   }).then((response) => {
  //     console.log(post);
  //   });
  // };



  function handleSubmitPost(e) {
    e.preventDefault();
    props.onSubmitPosts(...post);
    navigate( "/PostsList")

  }

  return (
    <Card element={<div className="postFormWrapper">
    <h2 className="form_start_title">Share Your Stuff!</h2>
    <div className="PostForm">
      <form onSubmit={handleSubmitPost}>
        <Input
          className={"input"}
          Name={"title"}
          Placeholder={"Item Name"}
          Type={"text"}
          Value={post.title}
          Label={"Item Name: "}
          onChange={(e, i) => {
            handleSetPost(e, i);
          }}
        />
        <Input
          className={"input"}
          Name={"description"}
          Placeholder={"Item Description"}
          Type={"text"}
          Value={post.description}
          rows={4}
          Label={"Item Description: "}
          onChange={(e, i) => {
            handleSetPost(e, i);
          }}
        />
        <ButtonComponent
          className={"post_button"}
          text="Share Item"
          onClicker={handleSubmitPost}
          disabled={false}
        />

          {selectedGroups.length && <PostGroups
                list={list}
                // handleSelectGroup={handleSelectGroup}
                selectedGroups={selectedGroups}
              />}
              
      </form>
    </div>
  </div> }/>
    
  );
}

export default EditPostForm;
