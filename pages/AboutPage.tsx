import React from 'react';
import Card from '../components/Card';
import { Users, Award, BookOpen } from 'lucide-react';

const team = [
  { name: 'RANGESHPANDIAN PT', id: 'RA2411003010037', role: 'Creator' },
  { name: 'M.ASWIN', id: 'RA2411003010058', role: 'Creator' },
  { name: 'P.M.PRANAV KUMAR', id: 'RA2411003010025', role: 'Creator' },
];

const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">About Us</h1>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-teal-500/5 to-blue-500/5 border-teal-200 dark:border-teal-800">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg flex items-center justify-center">
            <Users size={36} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Who we are</h2>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
              OS_VLab is an interactive learning environment designed to help students visualise and experiment with core operating system concepts. We build colourful, responsive simulations and easy-to-follow explanations so learners can focus on intuition and experimentation.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {team.map((member) => (
          <Card key={member.id} className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                {member.name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{member.role}</p>
                <p className="text-xs mt-1 font-mono text-sm text-accent">{member.id}</p>
              </div>
            </div>
          </Card>
        ))}

        <Card className="p-4 sm:p-6 md:col-span-3 bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300">
          <div className="flex items-start md:items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg flex items-center justify-center">
              <Award size={36} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Mentored by</h3>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
                Dr. M. Suchithra
              </p>
              <p className="text-xs text-text-muted-light mt-1">We are grateful for the guidance and mentorship provided in the development of this learning platform.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-cyan-50 border-indigo-200">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="text-indigo-500" size={20} />
          Our Vision
        </h2>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Make operating systems accessible through visualisation and hands-on simulations. We aim to help students learn by seeing and interacting — not just reading — and provide a platform for instructors to demonstrate core OS concepts in class.
        </p>
      </Card>
    </div>
  );
};

export default AboutPage;
