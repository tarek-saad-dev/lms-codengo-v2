import { quizOptions, challenges } from "@/db/schema";
import { Card } from "./card";

type Props = {
  options: (typeof quizOptions.$inferSelect)[]; // Correctly referencing the type of options
  onSelect: (id: number) => void;
  status: "correct" | "wrong" | "none"; // Status is limited to three possible values
  selectedOption?: number; // Optional selectedOption of type number
  disabled?: boolean; // Optional disabled property
  type: (typeof challenges.$inferSelect)["type"]; // Fixed typo here, referencing "type" properly
};

export const MultiChoices = ({
  options,
  onSelect,
  status,
  selectedOption,
  disabled = false,
  type, // Added type to the props
}: Props) => {
  return (
    <div className={`grid gap-2 ${type === "SELECT" ? "grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]" : "grid-cols-1"} `}>
      {options.map((option, i) => (
        <Card
          key={option.id} 
          id={option.id}
          text={option.text} 
          imageSrc={option.imageSrc}
          shortcut={`${i + 1}`} 
          selected={ selectedOption === option.id} 
          onClick={() => onSelect(option.id)}
          status={status}
          audioSrc={option.audioSrc}
          disabled={disabled}
          type={type}
        />
      ))}
    </div>
  );
};
