import React, { useState, useEffect } from "react";
import "../../CSS/GroupForm.css";
import ButtonComponent from "../Button";
import Input from "../Input"
import {useNavigate , useParams} from "react-router-dom";
import Card from "../Card";

function EditPostForm(props) {
  const [post, setPost] = useState({
     title: "", description: "", 

    isEditing: false,
  });

  useEffect(()=>{setPost(props.selectPost(params.id) )} , [] )

  let params = useParams();
  let navigate = useNavigate()


  const handleSetPost = (e, i) => {
    const nameValue = e.target.value;
    const nameKey = e.target.name;

    setPost({
      ...post,
      [nameKey]: nameValue,
    });
  };

  function handleSubmitPost(e) {
    e.preventDefault();
    props.onSubmitPosts(post);
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
      </form>
    </div>
  </div> }/>
    
  );
}

export default EditPostForm;
