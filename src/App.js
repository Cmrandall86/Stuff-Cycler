import "./App.css";
import "./CSS/NavBar.css"
import GroupForm from "./Components/GroupForm/GroupForm";
import Title from "./Components/Title";
import GroupsList from "./Components/GroupForm/GroupsList";
import { useState } from "react/cjs/react.development";
import {Routes, Route } from "react-router-dom";
import RoutesLayout from "./Components/RoutesLayout";
import PageNotFound from "./Components/PageNotFound";
import HomePage from "./Components/HomePage";
import EditGroupForm from "./Components/EditGroupForm"
import PostForm from "./Components/Posts/PostForm";

function App() {
  const [groups, setGroups] = useState([
    {
      groupName: "Family",
      id:"1",
      friends: [
        { firstName: "Chris", lastName: "Randall" },
        { firstName: "Allie", lastName: "Randall" },
      ],
    },
    {
      groupName: "Friends",
      id:"2",
      friends: [{ firstName: "Evan", lastName: "Jenkies" }],
    },
  ]);

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
          <Route path="/" index element={<HomePage/>}/>
          <Route path="/home" index element={<HomePage/>}/>
          <Route path="/GroupForm"  element={<GroupForm onSubmitGroups={handleSetGroups} />  } />
          <Route path="/GroupForm/:id/edit"  element={<EditGroupForm selectGroup={selectGroup} onSubmitGroups={handleUpdateGroup} />  } />
          <Route path="/GroupsList" element={<GroupsList list={groups} onDeleteGroups={handleDeleteGroups} />} />
          <Route path="*" element={<PageNotFound/>}/>
          <Route path="/PostForm" element={<PostForm/>}/>
        </Route>



      </Routes>
    </div>
  );
}

export default App;


