import { Settings as SettingsIcon, User, Bell, Shield, Palette, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and app preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-black rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-black">Account Settings</h3>
                <p className="text-sm text-gray-600">Manage your profile and preferences</p>
              </div>
            </div>
            <div className="space-y-3 pl-16">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Profile Information</span>
                <button className="text-sm text-blue-600 font-semibold">Edit</button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Change Password</span>
                <button className="text-sm text-blue-600 font-semibold">Update</button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Email Preferences</span>
                <button className="text-sm text-blue-600 font-semibold">Manage</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-black rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-black">Notifications</h3>
                <p className="text-sm text-gray-600">Configure alert preferences</p>
              </div>
            </div>
            <div className="space-y-3 pl-16">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">High Usage Alerts</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-12 h-6 bg-gray-300 peer-checked:bg-black rounded-full peer transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Cost Warnings</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-12 h-6 bg-gray-300 peer-checked:bg-black rounded-full peer transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Device Status Changes</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-12 h-6 bg-gray-300 peer-checked:bg-black rounded-full peer transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-black rounded-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-black">Appearance</h3>
                <p className="text-sm text-gray-600">Customize the look and feel</p>
              </div>
            </div>
            <div className="space-y-3 pl-16">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Theme</span>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>Auto</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Language</span>
                <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-black rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-black">Data & Privacy</h3>
                <p className="text-sm text-gray-600">Manage your data and privacy settings</p>
              </div>
            </div>
            <div className="space-y-3 pl-16">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Export Data</span>
                <button className="text-sm text-blue-600 font-semibold">Download</button>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">Delete Account</span>
                <button className="text-sm text-red-600 font-semibold">Delete</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black mb-1">More Settings Coming Soon</h3>
                <p className="text-sm text-gray-600">
                  We're adding more customization options, integrations, and advanced features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
