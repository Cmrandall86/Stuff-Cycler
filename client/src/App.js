import "./App.css";
import "./CSS/NavBar.css"
import GroupForm from "./Components/GroupForm/GroupForm";
import Title from "./Components/Title";
import GroupsList from "./Components/GroupForm/GroupsList";
import { useState, useEffect } from "react/cjs/react.development";
import {Routes, Route } from "react-router-dom";
import RoutesLayout from "./Components/RoutesLayout";
import PageNotFound from "./Components/PageNotFound";
import HomePage from "./Components/HomePage";
import EditGroupForm from "./Components/GroupForm/EditGroupForm"
import PostForm from "./Components/Posts/PostForm";
import PostsList from "./Components/Posts/PostsList";
import Card from "./Components/Card";
import EditPostForm from "./Components/Posts/EditPostForm";
import Auth from "./Auth";
import Account from "./Account";
import { supabase } from './supabaseClient'


function App() {
  const [session, setSession] = useState(null)
  useEffect(() => {
    setSession(supabase.auth.session())

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])


  const [groups, setGroups] = useState([

  ]);

  const [posts, setPosts] = useState([ 
  ]);

  function handleSetPosts(post){
    setPosts([...posts, post]);

    console.log(post)
  }

  function handleDeletePosts(index) {
    setPosts([...posts.slice(0, index), ...posts.slice(index + 1)]);
  }

  function handleUpdatePost(editPost){
    const editPostIndex = posts.findIndex(post => post.id === editPost.id )

    setPosts([...posts.slice(0, editPostIndex), editPost, ...posts.slice(editPostIndex + 1) ])
  }

  function selectPost(id) {
    let selectedPost = posts.find(post => id === post.id)

    return selectedPost
  }

  function handleSetGroups(group) {
    setGroups([...groups, group]);
  }

  function handleDeleteGroups(index) {
    setGroups([...groups.slice(0, index), ...groups.slice(index + 1)]);
  }

  function handleUpdateGroup(editGroup){
    const editGroupIndex = groups.findIndex(group => group.id === editGroup.id )

    setGroups([...groups.slice(0, editGroupIndex), editGroup, ...groups.slice(editGroupIndex + 1) ])
  }

  function selectGroup(id) {
    let selectedGroup = groups.find(group => id === group.id)

    return selectedGroup
  }

  return (
    <div className="App">
      <Title Title="Welcome To Stuff-Cycler!" />
      <Routes>

        <Route path="/" element={<RoutesLayout/> }>
          {!session ? <Route path="/login" element={ <Auth/>}/> : (
            <>
              <Route path="/" index element={<HomePage/>}/>
              <Route path="/home" index element={ <HomePage/>}/>
              <Route path="/account" element={ <Account session={session}/>}/>
              <Route path="/GroupForm"  element={<GroupForm onSubmitGroups={handleSetGroups} />  } />
              <Route path="/GroupForm/:id/edit"  element={<EditGroupForm selectGroup={selectGroup} onSubmitGroups={handleUpdateGroup} />  } />
              <Route path="/GroupsList" element={<GroupsList onDeleteGroups={handleDeleteGroups} />} />
              <Route path="*" element={<PageNotFound/>}/>
              <Route path="/PostForm" element={ <PostForm onSubmitPosts={handleSetPosts}/> }    />
              <Route path="/PostForm/:id/edit"  element={<EditPostForm />  } />
              <Route path="/PostsList" element={<PostsList onDeletePosts={handleDeletePosts} />} />
            </>
            )
           } 

        </Route>



      </Routes>
    </div>
  );
}

export default App;


// //chris
// 56c3f6cc-a394-42aa-92b9-0ba890d517df

// //allie
// bf3075d4-800e-4757-ab42-1317d7205c04

// //jenkins
// 077c07a5-4ef8-4a58-9ae7-54c9bcc49adb