"use client";

import { useState } from "react";
import { useAuth } from "@/context-providers/auth-context-provider";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import FullScreenLoader from "@/components/full-screen-loader";
import ProfileTab from "@/components/account/profile/profile-tab";
import ProfilePanel from "@/components/account/profile-panel";
import SettingsTab from "@/components/account/settings/settings-tab";
import SecurityTab from "@/components/account/security/security-tab";

const AccountPage = () => {

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { 
    user, 
    fetchingUser, 
  } = useAuth();

  if (fetchingUser) return <FullScreenLoader />;

  const handleEditClick = () => {
    if (!user || isEditing) return;
    setActiveTab(0);
    setIsEditing(true);
  }

  const handleProfileEditComplete = () => {
    setIsEditing(false);
  }

  return (
    <div className="page-container">

      {/* page title */}
      <h1 className="page-title-container page-title">Account Management</h1>

      {/* page layout */}
      <div className="flex gap-8 flex-col ll:flex-row">
        
        {/* first column */}
        <div className="ll:w-90">

          {/* profile card */}
          <ProfilePanel 
            editing={isEditing} 
            onEditClick={handleEditClick} 
          />
        </div>

        {/* second column */}
        <div className="w-full ll:flex-1 mx-auto md:mx-0">

          <TabGroup 
            className="flex flex-col gap-8"
            selectedIndex={activeTab} 
            // Programmatic tab changes (e.g. handleEditClick) bypass onChange,
            // so setIsEditing(false) here won't conflict with setIsEditing(true) there.
            onChange={(index) => {
              setActiveTab(index);
              setIsEditing(false);
            }}
          >
            <TabList className="tab-list panel">
              <Tab className="tab-list-item">
                Profile
              </Tab>
              <Tab className="tab-list-item">
                Settings
              </Tab>
              <Tab className="tab-list-item">
                Security
              </Tab>
            </TabList>
            <TabPanels>

              {/* Profile Tab */}
              <TabPanel>
                <ProfileTab 
                  editing={isEditing} 
                  onEditComplete={handleProfileEditComplete} 
                />
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <SettingsTab />
              </TabPanel>

              {/* Security Tab */}
              <TabPanel>
                <SecurityTab />
              </TabPanel>
              
            </TabPanels>
          </TabGroup>          
        </div>
      </div>
    </div>
  )
}

export default AccountPage