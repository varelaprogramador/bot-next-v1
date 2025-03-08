import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
    loading: boolean;
    onClick: () => void;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ loading, onClick }) => {
    return (
        <Button disabled={loading} onClick={onClick}>
            Update {loading && <Loader2 className="animate-spin" />}
        </Button>
    );
};

export default SubmitButton;