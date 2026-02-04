'use server';

import db from "@/db/drizzle";
import { courses, units, lessons, challenges, quizOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

interface LearningObject {
  lo_id: number;
  name: string;
}

interface SubLO {
  material: string;
  name: string;
  reference: string;
}

interface LOResponse {
  lo_id: number;
  sub_los: SubLO[];
}

async function fetchSubLOs(loId: number): Promise<SubLO[]> {
  try {
    const response = await fetch('https://iia-one.vercel.app/fetch/lo/child-sub-los', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lo_id: loId })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sub LOs: ${response.status}`);
    }

    const data: LOResponse = await response.json();
    return data.sub_los;
  } catch (error) {
    console.error(`Error fetching sub LOs for ${loId}:`, error);
    return [];
  }
}

const subLOTypeToChallenge: Record<string, ChallengeType> = {
  'introArticle': 'TEXT',
  'writeCode': 'SELECT',
  'quiz': 'TEXT', // Changed to TEXT to use WebView for forms
  'SBSVideo': 'VIDEO',
  'supportArticle': 'TEXT',
  'finalAssignment': 'PROJECT',
  'HowTo-video/PDF': 'PDF',
  'exerciseTask': 'TEXT', // Changed to TEXT to use WebView
  'tutorial-video/PDF': 'PDF',
  'interactiveDemo': 'TEXT', // Changed to TEXT to use WebView
  'summary': 'TEXT', // Added for quizizz and similar content
  'pdf': 'PDF'
};

type ChallengeType = 'SELECT' | 'ASSIST' | 'CODE' | 'VIDEO' | 'TEXT' | 'IMAGE' | 'PDF' | 'COMPLETE' | 'WRITE' | 'PROJECT';

export async function createCourse(title: string, learningObjects: LearningObject[], userId: string) {
  try {
    console.log('Creating course:', title);
    console.log('Learning objects:', learningObjects);

    // Create the course with an appropriate icon
    const normalizedTitle = title.toLowerCase();
    let iconSet = 'logos';
    let iconName = 'education';
    
    // Map course titles to appropriate icons based on content
    if (normalizedTitle.includes('javascript')) iconName = 'javascript';
    else if (normalizedTitle.includes('python')) iconName = 'python';
    else if (normalizedTitle.includes('react')) iconName = 'react';
    else if (normalizedTitle.includes('node')) iconName = 'nodejs';
    else if (normalizedTitle.includes('typescript')) iconName = 'typescript';
    else if (normalizedTitle.includes('angular')) iconName = 'angular';
    else if (normalizedTitle.includes('vue')) iconName = 'vue';
    else if (normalizedTitle.includes('java')) iconName = 'java';
    else if (normalizedTitle.includes('css')) iconName = 'css-3';
    else if (normalizedTitle.includes('html')) iconName = 'html-5';
    // Database related
    else if (normalizedTitle.includes('database') || normalizedTitle.includes('sql') || normalizedTitle.includes('nosql')) {
      iconSet = 'devicon';
      iconName = 'database';
    }
    // Data Structures and Algorithms
    else if (normalizedTitle.includes('data structure') || normalizedTitle.includes('algorithm') || 
             normalizedTitle.includes('sorting') || normalizedTitle.includes('searching')) {
      iconSet = 'carbon';
      iconName = 'data-structured';
    }
    // AI and ML
    else if (normalizedTitle.includes('artificial intelligence') || normalizedTitle.includes('machine learning') || 
             normalizedTitle.includes('neural') || normalizedTitle.includes('deep learning')) {
      iconSet = 'carbon';
      iconName = 'machine-learning';
    }
    // Cloud and Web
    else if (normalizedTitle.includes('cloud') || normalizedTitle.includes('aws') || normalizedTitle.includes('azure')) {
      iconSet = 'devicon';
      iconName = 'cloud';
    }
    // Cybersecurity
    else if (normalizedTitle.includes('security') || normalizedTitle.includes('crypto') || normalizedTitle.includes('encryption')) {
      iconSet = 'carbon';
      iconName = 'security';
    }
    // Mobile Development
    else if (normalizedTitle.includes('mobile') || normalizedTitle.includes('android') || normalizedTitle.includes('ios')) {
      iconSet = 'ant-design';
      iconName = 'mobile';
    }
    // Testing
    else if (normalizedTitle.includes('test') || normalizedTitle.includes('debugging')) {
      iconSet = 'carbon';
      iconName = 'test';
    }
    // Version Control
    else if (normalizedTitle.includes('git')) iconName = 'git';
    // IoT and Embedded
    else if (normalizedTitle.includes('iot') || normalizedTitle.includes('embedded')) {
      iconSet = 'carbon';
      iconName = 'iot-platform';
    }
    // Networks
    else if (normalizedTitle.includes('network') || normalizedTitle.includes('protocol')) {
      iconSet = 'carbon';
      iconName = 'network';
    }
    // Default programming/coding icon
    else {
      iconSet = 'material-symbols';
      iconName = 'code';
    }

    // Construct the icon URL based on the icon set and name
    let iconUrl: string;
    
    switch (iconSet) {
      case 'logos':
        iconUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=%2310b981`;
        break;
      case 'carbon':
        iconUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=%2310b981`;
        break;
      case 'devicon':
        iconUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=%2310b981`;
        break;
      case 'ant-design':
        iconUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=%2310b981`;
        break;
      case 'material-symbols':
        iconUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=%2310b981`;
        break;
      default:
        iconUrl = `https://api.iconify.design/material-symbols/code.svg?color=%2310b981`;
    }

    const imageSrc = iconUrl;
    
    const [newCourse] = await db.insert(courses).values({
      title,
      imageSrc,
      type: "CUSTOMIZE",
      makerId: userId,
    }).returning();

    if (!newCourse) throw new Error("Failed to create course");
    console.log('Created course:', newCourse);

    // Create the unit
    const [newUnit] = await db.insert(units).values({
      title,
      description: `Learn about ${title} and related technologies`,
      courseId: newCourse.id,
      order: 1,
    }).returning();

    if (!newUnit) throw new Error("Failed to create unit");
    console.log('Created unit:', newUnit);

    // Create lessons and fetch their sub LOs
    const newLessons: typeof lessons.$inferSelect[] = [];
    for (let i = 0; i < learningObjects.length; i++) {
      const lo = learningObjects[i];
      console.log(`\nProcessing learning object ${i + 1}/${learningObjects.length}:`, lo);
      
      // Create the lesson
      const [lesson] = await db.insert(lessons).values({
        title: lo.name,
        unitId: newUnit.id,
        order: i + 1,
      }).returning();

      if (!lesson) {
        console.error('Failed to create lesson for:', lo.name);
        continue;
      }
      
      console.log('Created lesson:', lesson);
      newLessons.push(lesson);

      // Fetch sub LOs for this learning object
      console.log(`Fetching sub LOs for learning object ${lo.lo_id}...`);
      const subLOs = await fetchSubLOs(lo.lo_id);
      console.log(`Found ${subLOs.length} sub LOs:`, subLOs);
      
      // Process each sub LO as a challenge
      for (let j = 0; j < subLOs.length; j++) {
        const subLO = subLOs[j];
        console.log(`\nProcessing sub LO ${j + 1}/${subLOs.length}:`, subLO);

        try {
          if (subLO.reference) {
            // Try to find existing challenge
            console.log(`Looking for existing challenge with ID ${subLO.reference}`);
            const referenceId = parseInt(subLO.reference);
            
            if (isNaN(referenceId)) {
              throw new Error(`Invalid reference ID: ${subLO.reference}`);
            }

            // Find the existing challenge
            const existingChallenge = await db.query.challenges.findFirst({
              where: eq(challenges.id, referenceId),
            });

            console.log(`Existing challenge:`, existingChallenge);

            if (existingChallenge) {
              console.log(`Found existing challenge ${existingChallenge.id}, creating duplicate for lesson ${lesson.id}`);
              
              // Create a new challenge based on the existing one
              const newChallengeData = {
                ...existingChallenge,
                id: undefined, // Remove id to create a new record
                lessonId: lesson.id,
                order: j + 1,
                label: existingChallenge.label || subLO.name,
                explanation: existingChallenge.explanation || subLO.material
              };
              
              const [duplicatedChallenge] = await db.insert(challenges)
                .values(newChallengeData)
                .returning();
              
              if (duplicatedChallenge) {
                console.log(`Created duplicate challenge ${duplicatedChallenge.id} for lesson ${lesson.id}`);
                
                // If it's a SELECT challenge, duplicate the quiz options too
                if (existingChallenge.type === 'SELECT') {
                  const existingOptions = await db.select().from(quizOptions)
                    .where(eq(quizOptions.challengeId, referenceId));
                  
                  if (existingOptions.length > 0) {
                    const newOptionsData = existingOptions.map(option => ({
                      ...option,
                      id: undefined,
                      challengeId: duplicatedChallenge.id
                    }));
                    
                    await db.insert(quizOptions).values(newOptionsData);
                    console.log(`Duplicated ${newOptionsData.length} quiz options for challenge ${duplicatedChallenge.id}`);
                  }
                }
                
                continue; // Skip to next subLO since we've handled this one
              }
            }
            
            // If we get here, either the challenge wasn't found or duplication failed
            console.log(`Warning: Referenced challenge ${subLO.reference} not found or duplication failed, creating new challenge`);
          }
          
          // Create new challenge (either because there's no reference or reference handling failed)
          console.log('Creating new challenge for:', subLO.name);
          let challengeType;
          
          // Determine the challenge type based on the material content
          if (subLO.material) {
            if (subLO.material.includes('youtube.com') || subLO.material.includes('youtu.be')) {
              challengeType = 'VIDEO';
            } else if (subLO.reference && (subLO.reference.includes('youtu') || subLO.reference.includes('youtu.be'))) {
              challengeType = 'VIDEO';
              // Use reference as the video URL if it's a YouTube link
              subLO.material = subLO.reference;
            } else if (subLO.material.includes('.pdf')) {
              challengeType = 'PDF';
            } else {
              // Use TEXT type for all web content to enable WebView
              challengeType = 'TEXT';
            }
          } else {
            challengeType = subLOTypeToChallenge[subLO.name] || 'TEXT';
          }
          
          console.log('Mapped challenge type:', challengeType);
          
          // Prepare base challenge data
          const baseData = {
            lessonId: lesson.id,
            type: challengeType,
            label: subLO.name,
            order: j + 1,
            explanation: subLO.material || undefined,
            webViewContent: subLO.material || undefined, // Store material in webViewContent for web view
          };

          // Add specific fields based on challenge type
          let challengeData;
          if (challengeType === 'VIDEO') {
            // Store video URL in videoURL field instead of webViewContent
            challengeData = {
              ...baseData,
              videoURL: subLO.material,
              webViewContent: undefined, // Clear webViewContent for video challenges
            };
          } else if (challengeType === 'PDF' && subLO.material?.includes('.pdf')) {
            challengeData = {
              ...baseData,
              pdfURL: subLO.material,
            };
          } else if (challengeType === 'CODE') {
            challengeData = {
              ...baseData,
              initialCode: '// Write your code here',
              language: 'javascript',
              testCases: '[]',
            };
          // Remove duplicate VIDEO case since it's handled above
          } else if (challengeType === 'PROJECT') {
            challengeData = {
              ...baseData,
              projectStructure: '[]',
              projectFiles: '{}',
            };
          } else if (challengeType === 'SELECT') {
            challengeData = {
              ...baseData,
              textContent: subLO.material || 'Select the correct answer',
            };

            // Create the challenge first
            const [newChallenge] = await db.insert(challenges).values(challengeData).returning();
            
            if (newChallenge) {
              console.log('Created new SELECT challenge:', newChallenge);
              
              let quizOptionsData;
              
              // Check if the referenced challenge has quiz options
              if (subLO.reference) {
                const referenceId = parseInt(subLO.reference);
                if (!isNaN(referenceId)) {
                  // Get quiz options from referenced challenge
                  const existingOptions = await db.select().from(quizOptions)
                    .where(eq(quizOptions.challengeId, referenceId));

                  if (existingOptions.length > 0) {
                    // Copy existing options for the new challenge
                    quizOptionsData = existingOptions.map(option => ({
                      challengeId: newChallenge.id,
                      text: option.text,
                      correct: option.correct,
                      order: option.order,
                      imageSrc: option.imageSrc,
                      audioSrc: option.audioSrc,
                    }));
                    console.log('Using quiz options from reference challenge:', referenceId);
                  }
                }
              }

              // If no existing options found or no reference, create default options
              if (!quizOptionsData) {
                quizOptionsData = [
                  { text: 'Option 1', correct: true, order: 1 },
                  { text: 'Option 2', correct: false, order: 2 },
                  { text: 'Option 3', correct: false, order: 3 },
                  { text: 'Option 4', correct: false, order: 4 },
                ].map(option => ({
                  ...option,
                  challengeId: newChallenge.id
                }));
                console.log('Using default quiz options');
              }

              // Insert the quiz options
              await db.insert(quizOptions).values(quizOptionsData);
              console.log(`Created ${quizOptionsData.length} quiz options for challenge:`, newChallenge.id);
            }

            // Skip the general challenge creation since we already created it
            continue;
          } else {
            challengeData = baseData;
          }

          const [newChallenge] = await db.insert(challenges).values(challengeData).returning();

          if (newChallenge) {
            console.log('Created new challenge:', newChallenge);
          }
        } catch (error) {
          console.error(`Error processing sub LO for lesson ${lesson.id}:`, error);
        }
      }
    }

    return {
      course: newCourse,
      unit: newUnit,
      lessons: newLessons,
    };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}
