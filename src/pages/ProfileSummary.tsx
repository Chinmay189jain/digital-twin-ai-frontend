import React, { useEffect } from 'react';
import { useTwin } from '../context/TwinContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getProfileSummary } from '../api/chatApi';

const ProfileSummary: React.FC = () => {
  const navigate = useNavigate();
  const { profileSummary, setProfileSummary } = useTwin();
  const { user } = useAuth();

  // Redirect to /generate-profile if summary is missing
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getProfileSummary();
        if(data){
          setProfileSummary(data);
        } else {
          toast.error('No profile summary found. Please generate it first.');
          navigate('/generate-profile');
        }
        console.log(user);
      } catch(error: any){
        console.error("Failed to fetch profile summary:", error);
        toast.error('Failed to fetch profile summary.');
        navigate('/generate-profile');   
      }
    }
    fetchSummary();
  }, [navigate, setProfileSummary]);

  // If summary is empty (before redirect), render nothing
  if (!profileSummary) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🎉</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Digital Twin is Ready!
          </h1>

          {/* <DisplaySummary profileSummary={profileSummary} /> */}

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Twin Summary
              </h2>
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                    {profileSummary}
            </div>
            </div>

          <button
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Ask Your Twin
          </button>
        </div>
      </div>
    </div>
  );
};

// Define the structure of a color object
interface ColorScheme {
  bg: string;
  border: string;
  text: string;
}

// Define the allowed section names (lowercase) and a fallback `default`
type SectionName = 'personality' | 'values' | 'fears' | 'goals' | 'default';

// Define the function type: input is string, output is a ColorScheme
type SectionColor = (sectionName: string) => ColorScheme;

interface DisplaySummaryProps {
  profileSummary: string;
}

const DisplaySummary: React.FC<DisplaySummaryProps> = ({profileSummary}) => {
  debugger;
  const parsedSummaryData: ParsedSummary = parseSummaryData(profileSummary);

  const getSectionColor: SectionColor = (sectionName: string) => {
    const colors: Record<SectionName, ColorScheme> = {
      personality: { bg: 'bg-blue-900/30', border: 'border-blue-400', text: 'text-blue-300' },
      values: { bg: 'bg-green-900/30', border: 'border-green-400', text: 'text-green-300' },
      fears: { bg: 'bg-red-900/30', border: 'border-red-400', text: 'text-red-300' },
      goals: { bg: 'bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-300' },
      default: { bg: 'bg-gray-900/30', border: 'border-gray-400', text: 'text-gray-300' }
    };
    return colors[sectionName.toLowerCase() as SectionName] || colors.default;
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Twin Summary
      </h2>
      
      {/* Display heading if it exists */}
      {parsedSummaryData.Personality && (
        <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
          {parsedSummaryData.Personality}
        </div>
      )}

      <div className="space-y-6 mt-8">
        {Object.entries(parseSummaryData).map(([sectionName, items]) => {
          // Skip heading and ensure items is an array
          if (sectionName === 'heading' || !Array.isArray(items) || items.length === 0) {
            return null;
          }

          const colors = getSectionColor(sectionName);

          return (
            <div key={sectionName} className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
              <h3 className={`text-lg font-semibold ${colors.text} mb-3`}>
                {capitalizeFirst(sectionName)}
              </h3>
              <ul className="space-y-2">
                {items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start text-gray-300">
                    <span className={`${colors.text} mr-2 mt-1 text-sm`}>•</span>
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  )
}

interface SummarySection {
  heading?: string,
  [key: string]: string[] | string | undefined;
}

interface BulletPoint {
  title?: string;
  description: string;
}

interface ParsedSummary {
  Personality?: string;
  Values?: BulletPoint[];
  Fears?: BulletPoint[];
  Goals?: BulletPoint[];
  Insights?: string[];
}

//type keyPArsedSummary = 'Personality' | 'Values' | 'Fears' | 'Goals' | 'Insights';

// Function to parse the summary string into a structured object
const parseSummaryData = (data: string): ParsedSummary => {
  if(!data) return {};
  const parts = data.split(/\*\*(.*?)\*\*/);
  //const sections: SummarySection = {};
  var sectionName: string = '';
  // parts.forEach(function (eachLine) {
  //   // First part is always the introduction paragraph — save it as heading
  //   if (!sections.heading) {
  //     sections.heading = eachLine.trim();
  //   } else if (eachLine.includes(":") && !eachLine.includes(" ")) { // Check if the line looks like a section heading
  //     sectionName = eachLine.replace(':', '').trim();
  //   } else if (sectionName) {
  //     const sectionValue = eachLine.split('*').map(item => item.trim()).filter(item => item.length > 0);
  //     sections[sectionName] = sectionValue;
  //     sectionName = '';
  //   }
  // });
  const result: ParsedSummary = {};
  const sections = data.split(/\*\*(.*?)\*\*/);
  let currentKey = '';
  for (let i = 1; i < sections.length; i += 2) {
    const rawKey = sections[i].trim();
    const content = sections[i + 1]?.trim();

    if (!content) continue;

    const key = rawKey.charAt(0).toUpperCase() + rawKey.slice(1).replace(':', '');

    if (key === 'Personality') {
      result.Personality = content;
    } else if (['Values', 'Fears', 'Goals'].includes(key)) {
      const lines = content.split('\n').filter(line => line.trim().startsWith('*'));
      const bulletPoints: BulletPoint[] = lines.map(line => {
        const cleaned = line.replace(/^\*\s*/, '').trim();
        const [title, ...rest] = cleaned.split(':');
        return {
          title: rest.length ? title.trim() : undefined,
          description: rest.length ? rest.join(':').trim() : title.trim()
        };
      });

      // Use type assertion to tell TypeScript we're assigning to known keys
      (result as any)[key] = bulletPoints;
    } else if (key === 'Insights') {
      const lines = content.split('\n').filter(line => line.trim().startsWith('*'));
      result.Insights = lines.map(line => line.replace(/^\*\s*/, '').trim());
    }
  }
  return result;
}

export default ProfileSummary;
